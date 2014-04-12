App = Ember.Application.create({LOG_TRANSITIONS: true, LOG_TRANSITIONS_INTERNAL: true});
App.ApplicationAdapter = DS.FixtureAdapter.extend();

App.OptionController = Ember.ObjectController.extend({
    panel_href: function() {
	return '#option' + this.get('option_id');
    }.property(),
    panel_id: function() {
	return 'option' + this.get('option_id');
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
    }.property(),
    is_asian: function() {
	if(this.get('type').search('^asian') >= 0) { return true; }
	else { return false; }
    }.property(),
    is_basket: function() {
	if(this.get('type').search('^basket') >= 0) { return true; }
	else { return false; }
    }.property(),
    is_monte_carlo: function() {
	if(this.get('type').search('_arithmetic$') >= 0) { return true; }
	else { return false; }
    }.property(),
    number_of_assets: function() {
	if(this.get('is_basket'))
	{
	    return Math.min.apply(null, [this.get('start_prices').length, this.get('volatilities').length, this.get('correlations').length]);
	}
	else
	{
	    return 1;
	}
    }.property(),
    assets: function() {
	if(this.get('is_basket'))
	{
	    var assets = [];

	    for(var asset = 0; asset < this.get('number_of_assets'); asset++)
	    {
		var raw_correlations = this.get('correlations')[asset];
		var correlations = [];
		for(var c = 0; c < raw_correlations.length; c++)
		{
		    correlations.push({
			value: raw_correlations[c] * 100,
			text_muted: (c <= asset),
		    });
		}
		
		assets.push({
		    index: asset+1,
		    correlations_column: 'col-sm-'+(asset+2).toString(),
		    start_price: this.get('start_prices')[asset],
		    volatility: this.get('volatilities')[asset],
		    correlations: correlations,
		});
	    }

	    return assets;
	}
	else
	{
	    return [{
		index: 1,
		correlations_column: 'col-sm-2',
		start_price: this.get('start_price'),
		volatility: this.get('volatility')
	    }];
	}
    }.property(),
});

App.Router.map(function() {
    this.resource('options', {path: '/'});
});

App.OptionsRoute = Ember.Route.extend({
    model: function() {
	return this.store.find('option');
	//return App.Option.all();
    }
});

Ember.Handlebars.helper('log', function(value, options) {
    console.log(value);
    return '';
});

Ember.Handlebars.helper('interval_size', function(interval, options) {
    return +(interval[1] - interval[0]).toFixed(5);
});

Ember.Handlebars.helper('percentage', function(value, options) {
    return +(value*100).toFixed(5);
});
