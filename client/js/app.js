App = Ember.Application.create({LOG_TRANSITIONS: true, LOG_TRANSITIONS_INTERNAL: true});
App.ApplicationAdapter = DS.RESTAdapter.extend({
    namespace: 'api',
});

App.ApplicationController = Ember.Controller.extend({
    title: 'OpenCL Option Pricer',
    tagline: 'Raw power at your fingertips',
});

App.ArrayTransform = DS.Transform.extend({
    deserialize: function(serialized) {
	return Em.isNone(serialized) ? [] : serialized;
    },
    serialize: function(deserialized) {
	return Em.isNone(deserialized) ? [] : deserialized;
    },
});

App.OptionsNewRoute = Ember.Route.extend({
    model: function() {
	new_model = this.store.createRecord('option', {});
	new_model.get('assets').pushObject(this.store.createRecord('asset', {index:0}));
	
	correlations_row = Ember.A([]);
	correlations_row.pushObject({value: 100});
	correlations = Ember.A([]);
	correlations.pushObject(correlations_row);
	console.log(correlations);
	console.log(correlations.objectAt(0));
	console.log(correlations.objectAt(0).objectAt(0));
	new_model.set('correlations', correlations);

	return new_model;
    }
});

App.AssetController = Ember.ObjectController.extend({
    needs: 'option',
    can_be_removed: function() {
	var is_last = this.get('index') == (this.get('option.assets.length')-1);
	var is_only = this.get('option.assets.length') == 1;
	return (is_last && !is_only);
    }.property('index', 'option.assets.@each'),
});

App.OptionsNewController = Ember.Controller.extend({
    option_types: [
	{name: 'European', code: 'european'},
	{name: 'Geometric Asian', code: 'asian_geometric'},
	{name: 'Arithmetic Asian', code: 'asian_arithmetic'},
	{name: 'Geometric Basket', code: 'basket_geometric'},
	{name: 'Arithmetic Basket', code: 'basket_arithmetic'},
    ],
    is_basket: function() {
	if(this.get('model.type') && this.get('model.type').search('^basket') >= 0) { return true; }
	else { return false; }
    }.property('model.type'),
    is_asian: function() {
	if(this.get('model.type') && this.get('model.type').search('^asian') >= 0) { return true; }
	else { return false; }
    }.property('model.type'),
    is_monte_carlo: function() {
	if(this.get('model.type').search('_arithmetic$') >= 0) { return true; }
	else { return false; }
    }.property('model.type'),
    correlations_header: function() {
	var correlations_header = Ember.A([]);
	
	for(var asset = 0; asset < this.get('model.assets.length'); asset++)
	{
	    correlations_header.pushObject({
		index: asset+1,
		column_class: 'col-sm-'+(asset+2).toString()
	    });
	}

	return correlations_header;
    }.property('model.assets.@each'),
    correlations: function(key, value) {
	console.log("CORRELATIONS: " + value);

	var raw_correlations = this.get('model.correlations');
	var correlations = Ember.A([]);
	var number_of_assets = this.get('model.assets.length');

	for(var asset = 0; asset < number_of_assets; asset++)
	{
	    var raw_correlations_row = (raw_correlations === undefined ? Ember.A([]) : raw_correlations.objectAt(asset));
	    var correlations_row = Ember.A([]);

	    for(var c = 0; c < number_of_assets; c++)
	    {
		var value = (raw_correlations_row.length <= c ? 0 : raw_correlations_row.objectAt(c));
		if(!(value.value === undefined)) { value = value.value; }
		if(c == asset) { value = 100; }

		correlations_row.pushObject({
		    row_index: asset+1,
		    column_index: c+1,
		    value: value,
		    is_required: (c > asset),
		    is_diagonal: (c == asset),
		});
	    }

	    correlations.pushObject({row_index: asset+1, row: correlations_row, column_class: 'col-sm-'+(asset+2).toString()});
	}

	return correlations;
    }.property('model.assets.@each', 'model.correlations', 'model.correlations.@each'),
    set_correlation: function(row_index, column_index, value) {
	var number_of_assets = this.get('model.assets.length');
	var correlations = this.get('model.correlations');
	if(!correlations)
	{
	    correlations = Ember.A([]);
	    for(var asset = 0; asset < number_of_assets; asset++)
	    {
		var row = Ember.A([]);
		for(var column = 0; column < number_of_assets; column++)
		{
		    row.pushObject({value: (column == asset ? 100 : 0)});
		}

		correlations.pushObject(row);
	    }
	}

	correlations.objectAt(row_index).objectAt(column_index).value = value;
	correlations.objectAt(column_index).objectAt(row_index).value = value;
	this.set('model.correlations', correlations);
    },
    start_price: function(key, value) {
	if(value === undefined)
	{	
	    if(this.get('model.assets.length') > 0)
	    {
		return this.get('model.assets').objectAt(0).get('start_price');
	    }
	    else
	    {
	    return undefined;
	    }
	}
	else
	{
	    this.get('model.assets').objectAt(0).set('start_price', value);
	}
    }.property('model.assets.@each.start_price'),
    volatility: function(key, value) {
	if(value === undefined)
	{	
	    if(this.get('model.assets.length') > 0)
	    {
		return this.get('model.assets').objectAt(0).get('volatility');
	    }
	    else
	    {
	    return undefined;
	    }
	}
	else
	{
	    this.get('model.assets').objectAt(0).set('volatility', value);
	}
    }.property('model.assets.@each.volatility'),
    bool_direction: function(key, value) {
	if(value === undefined)
	{	
	    return (this.get('model.direction') != 'call');
	}
	else
	{
	    if(value == true)
	    {
		this.set('model.direction', 'put');
	    }
	    else
	    {
		this.set('model.direction', 'call');
	    }
	}
    }.property('model.direction'),
    bool_control_variate: function(key, value) {
	if(value === undefined)
	{	
	    return (this.get('model.control_variate') != 'none');
	}
	else
	{
	    if(value == true)
	    {
		if(this.get('bool_adjusted_strike')) { this.set('model.control_variate', 'geometric_adjusted_strike'); }
		else { this.set('model.control_variate', 'geometric'); }
	    }
	    else
	    {
		this.set('model.control_variate', 'none');
	    }
	}
	return (this.get('model.control_variate') != 'none');
    }.property('model.control_variate', 'bool_adjusted_strike'),
    bool_no_control_variate: function(key, value) {
	return (this.get('model.control_variate') == 'none');
    }.property('model.control_variate'),
    bool_adjusted_strike: function(key, value) {
	if(value === undefined)
	{
	    return (this.get('model.control_variate').search('_adjusted_strike$') > 0);
	}
	else
	{
	    if(value == true && this.get('bool_control_variate'))
	    {
		this.set('model.control_variate', 'geometric_adjusted_strike');
	    }
	    else
	    {
		if(this.get('bool_control_variate')) { this.set('model.control_variate', 'geometric'); }
		else { this.set('model.control_variate', 'none'); }
	    }
	}
	return (this.get('model.control_variate').search('_adjusted_strike$') > 0);
    }.property('model.control_variate', 'bool_control_variate'),
    actions: {
	add_asset: function() {
	    this.get('model.assets').pushObject(this.store.createRecord('asset', {
		index: this.get('model.assets.length')
	    })); 

	    for(var asset = 0; asset < this.get('model.assets.length')-1; asset++)
	    {
		this.get('model.correlations.'+asset).pushObject({value: 0});
	    }
	    var correlation_row = Ember.A([]);
	    for(var asset = 0; asset < this.get('model.assets.length'); asset++)
	    {
		correlation_row.pushObject({value: (asset == this.get('model.assets.length')-1) ? 100 : 0});
	    }
	    console.log(correlation_row);
	    this.get('model.correlations').pushObject(correlation_row);
	},
	remove_last_asset: function() {
	    if(this.get('model.assets.length') > 1)
	    {
		this.get('model.assets').removeAt(this.get('model.assets.length')-1);
	    }
	},
	create_option: function() {
	    console.log(this.get('model.type'));
	    console.log(this.get('model.direction'));
	    console.log(this.get('model.control_variate'));

	    console.log(this.get('model.strike_price'));
	    console.log(this.get('model.maturity'));
	    console.log(this.get('model.risk_free_rate'));
	    console.log(this.get('model.averaging_steps'));

	    console.log(this.get('model.samples'));
	    
	    for(var asset = 0; asset < this.get('model.assets.length'); asset++)
	    {
		console.log(this.get('model.assets').objectAt(asset).get('start_price'));
		console.log(this.get('model.assets').objectAt(asset).get('volatility'));
	    }

	    for(var asset = 0; asset < this.get('model.correlations.length'); asset++)
	    {
		var row = this.get('model.correlations').objectAt(asset);
		for(var column = 0; column < row.get('length'); column++)
		{
		    console.log('Correlations ('+(asset+1)+', '+(column+1)+'): ' + row.objectAt(column).value);
		}
	    }
	}
    },
});

App.OptionController = Ember.ObjectController.extend({
    panel_href: function() {
	return '#option' + this.get('id');
    }.property(),
    panel_id: function() {
	return 'option' + this.get('id');
    }.property(),
    type_string: function() {
	switch(this.get('type'))
	{
	case 'european':
	    return 'European';
	    break;
	case 'asian_geometric':
	    return 'Geometric Asian';
	    break;
	case 'asian_arithmetic':
	    return 'Arithmetic Asian';
	    break;
	case 'basket_geometric':
	    return 'Geometric Basket';
	    break;
	case 'basket_arithmetic':
	    return 'Arithmetic Basket';
	    break;
	}
    }.property('type'),
    is_asian: function() {
	if(this.get('type').search('^asian') >= 0) { return true; }
	else { return false; }
    }.property('type'),
    is_basket: function() {
	if(this.get('type').search('^basket') >= 0) { return true; }
	else { return false; }
    }.property('type'),
    is_monte_carlo: function() {
	if(this.get('type').search('_arithmetic$') >= 0) { return true; }
	else { return false; }
    }.property('type'),
    number_of_assets: function() {
	return this.get('assets').length;
    }.property('type'),
    correlations: function() {
	var correlations = Ember.A([]);

	var number_of_assets = this.get('model.assets.length');
	for(var asset = 0; asset < number_of_assets; asset++)
	{
	    var raw_correlations_row = this.get('model.correlations')[asset];
	    var correlations_row = Ember.A([]);
	    if(!(raw_correlations_row === undefined))
	    {
	    	for(var c = 0; c < raw_correlations_row.length; c++)
	    	{
	    	    correlations_row.pushObject({
	    		row_index: asset+1,
	    		column_index: c+1,
	    		value: raw_correlations_row[c] * 100,
	    		text_muted: (c <= asset),
	    	    });
	    	}
	    }

	    correlations.pushObject({row_index: asset+1, row: correlations_row, column_class: 'col-sm-'+(asset+2).toString()});
	}

	return correlations;
    }.property('assets'),
    start_price: function() {
	if(this.get('model.assets.length') > 0)
	{
	    return this.get('model.assets').objectAt(0).get('start_price');
	}
	else
	{
	    return 0;
	}
    }.property('model.assets.@each.start_price'),
    volatility: function() {
	if(this.get('model.assets.length') > 0)
	{
	    return this.get('model.assets').objectAt(0).get('volatility');
	}
	else
	{
	    return 0;
	}
    }.property('model.assets.@each.volatility'),
});

App.Router.map(function() {
    this.resource('options', {path: '/'}, function() {
	this.route('new');
    });
});

App.OptionsRoute = Ember.Route.extend({
    model: function() {
	return this.store.find('option', {completed: true});
    }
});

Ember.Handlebars.helper('interval_size', function(interval, options) {
    return +(interval[1] - interval[0]).toFixed(5);
});

Ember.Handlebars.helper('percentage', function(value, options) {
    return +(value*100).toFixed(5);
});

Ember.Handlebars.helper('index1', function(value, options) {
    return +(value+1).toString();
});

Ember.Handlebars.helper('unit', function(unit, options) {
    var escaped = Handlebars.Utils.escapeExpression(unit);
    return new Handlebars.SafeString('<span class="text-muted">' + escaped + '</span>');
});

App.CorrelationView = Ember.TextField.extend({
    parentController: undefined,
    row_index: 0,
    column_index: 0,
    value: 0,

    valueChanged: function() {
	var value = this.get('value');
	var row_index = this.get('row_index')-1;
	var column_index = this.get('column_index')-1;
	var parent_controller = this.get('parentController');
	console.log('Value: ' + value);
	console.log('Row: ' + row_index);
	console.log('Column: ' + column_index);
	console.log('Parent Controller: ' + parent_controller);

	parent_controller.set_correlation(row_index, column_index, value);
	//this.$().focus();
    }.observes('value')
});

Ember.Checkbox.reopen({
    attributeBindings: ['data-on-text', 'data-off-text', 'data-on-color', 'data-off-color'],
});
App.SwitchView = Ember.View.extend({
    templateName: 'bootstrap-switch',
    element_selector: '.ember-bootstrap-switch',
    onText: 'ON',
    offText: 'OFF',
    onColor: 'primary',
    offColor: 'default',
    didInsertElement: function() {
	var view = this;
	this.$(this.get('element_selector')).bootstrapSwitch();
	this.$(this.get('element_selector')).on('switchChange.bootstrapSwitch', function(event, state) {
	    view.set('value', state);
	});
    },
    toggleState: function() {
	this.$(this.get('element_selector')).bootstrapSwitch('toggleState');
	return this;
    },
    disabledChanged: function() {
	this.$(this.get('element_selector')).bootstrapSwitch('state', this.get('value'));
	this.$(this.get('element_selector')).bootstrapSwitch('disabled', this.get('disabled'));
    }.observes('disabled')
});

App.LogSliderView = Ember.View.extend({
    templateName: 'bootstrap-slider',
    element_selector: '.ember-bootstrap-slider',
    didInsertElement: function() {
	this.$(this.get('element_selector')).slider({
	    formater: function(value) {
		switch(value)
		{
		case 0:
		case 1:
		case 2:
		    return Math.pow(10, value).toString();
		    break;
		case 3:
		    return 'One thousand';
		    break;
		case 4:
		    return '10 thousand';
		    break;
		case 5:
		    return '100 thousand';
		    break;
		case 6:
		    return 'One million';
		    break;
		case 7:
		    return '10 million';
		    break;
		case 8:
		    return '100 million';
		    break;
		case 9:
		    return '1 billion';
		    break;
		case 10:
		    return '10 billion';
		    break;
		case 11:
		    return '100 billion';
		    break;
		case 12:
		    return '1 trillion, might take a while...';
		    break;
		}
	    }
	});
	var view = this;
	this.$(this.get('element_selector')).on('slideStop', function(event) {
	    view.set('value', Math.pow(10, event.value));
	});
    },
});
