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

App.OptionsNewController = Ember.Controller.extend({
    option_types: [
	{name: 'European', code: 'european'},
	{name: 'Geometric Asian', code: 'asian_geometric'},
	{name: 'Arithmetic Asian', code: 'asian_arithmetic'},
	{name: 'Geometric Basket', code: 'basket_geometric'},
	{name: 'Arithmetic Basket', code: 'basket_arithmetic'},
    ],
    is_basket: function() {
	if(this.get('type') && this.get('type').search('^basket') >= 0) { return true; }
	else { return false; }
    }.property('type'),

    actions: {
	create_option: function () {
	    var type = this.get('type');
	    var number_of_assets = parseInt(this.get('number_of_assets'));

	    var option = this.store.createRecord('option', {
		id: Date.now().toString(),
		type: type,
		number_of_assets: number_of_assets,
		timestamp: Date.now().toString(),
		option_id: Date.now().toString(),
		strike_price: 0,
		maturity: 0,
		risk_free_rate: 0,
		start_price: 0,
		start_prices: [],
		volatility: 0,
		volatilities: [],
		correlations: [],
		price: 0,
		confidence_interval: [0,0],
		samples: 0,
		completed: false,
		priced: false,
	    });

	    this.store.push('option', option);
	    this.transitionToRoute('options.edit', option.id);
	},
    },
});
App.OptionsEditController = Ember.Controller.extend({
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
    correlations: function() {
	var correlations = Ember.A([]);

	for(var asset = 0; asset < this.get('model.assets').length; asset++)
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
			value: raw_correlations[c] * 100,
			text_muted: (c <= asset),
		    });
		}
	    }
	    console.log(correlations_row);

	    correlations.pushObject({row_index: asset+1, row: correlations_row, column_class: 'col-sm-'+(asset+2).toString()});
	}

	return correlations;
    }.property('model.assets'),
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
	console.log(number_of_assets);
	for(var asset = 0; asset < number_of_assets; asset++)
	{
	    var raw_correlations_row = this.get('model.correlations')[asset];
	    console.log(raw_correlations_row);
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
	    console.log(correlations_row);

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
	this.route('edit', {path: '/edit/:option_id'});
	this.route('price');
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

Ember.Handlebars.helper('unit', function(unit, options) {
    var escaped = Handlebars.Utils.escapeExpression(unit);
    return new Handlebars.SafeString('<span class="text-muted">' + escaped + '</span>');
});
