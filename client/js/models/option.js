App.Option = DS.Model.extend({
    _id: DS.attr('string'),

    type: DS.attr('string', {defaultValue: 'european'}),
    direction: DS.attr('string', {defaultValue: 'call'}),
    control_variate: DS.attr('string', {defaultValue: 'none'}),

    timestamp: DS.attr('date'),

    strike_price: DS.attr('number'),
    maturity: DS.attr('number'),
    risk_free_rate: DS.attr('number'),
    averaging_steps: DS.attr('number'),

    assets: DS.hasMany('asset', {embedded: 'always'}),
    correlations: DS.attr('array'),
    
    price: DS.attr('number'),
    confidence_interval: DS.attr('array'),
    samples: DS.attr('number', {defaultValue: 6}),

    priced: DS.attr('boolean', {defaultValue: false}),
    processing: DS.attr('boolean', {defaultValue: false}),

    reload_timer: undefined,

    reload_if_not_priced: function(option) {
	console.log("RELOAD TIMER FIRED FOR: " + option);
	if(option.get('priced'))
	{
	    console.log('clearing timer: ' + option.get('reload_timer'));
	    clearInterval(option.get('reload_timer'));
	}
	else
	{
	    option.reload();
	}
    },

    didUpdate: function() {
	console.log('UPDATING: ' + this);
    },
    setup_reload_timer: function() {
	var self = this;

	if(this.get('isNew')) { return; }
	if(this.get('priced')) { return; }
	
	console.log("SETTING RELOAD TIMER FOR: " + this);
	this.set('reload_timer', setInterval(function() {self.reload_if_not_priced(self);}, 10*1000));
    },
    didLoad: function() {
	this.setup_reload_timer();
    },

    validate: function() {
	var errors = [];

	if(isNaN(parseFloat(this.get('strike_price'))) || parseFloat(this.get('strike_price')) < 0) { errors.push("Strike price must be at least 0."); }
	if(isNaN(parseFloat(this.get('maturity'))) || parseFloat(this.get('maturity')) <= 0) { errors.push("Maturity must be greater than 0."); }
	if(isNaN(parseFloat(this.get('risk_free_rate'))) || parseFloat(this.get('risk_free_rate')) < 0) { errors.push("Risk-free rate must be at least 0."); }
	if(this.get('type').search('^asian') >= 0 && isNaN(parseInt(this.get('averaging_steps'))) || parseInt(this.get('averaging_steps')) <= 0) { errors.push("Asian options must have at least one averaging step."); }
	if(this.get('type').search('_arithmetic$') >= 0 && isNaN(parseInt(this.get('samples'))) || parseInt(this.get('samples')) <= 0) { errors.push("Monte Carlo options must have at least 1 sample."); }
	
	if(this.get('type').search('^basket') >= 0)
	{
	    var number_of_assets = this.get('assets.length');
	    if(this.get('correlations.length') != number_of_assets) { errors.push("Size of correlations matrix must match number of assets."); }
	    else
	    {
		for(var row = 0; row < number_of_assets; row++)
		{
		    var correlations_row = this.get('correlations').objectAt(row);
		    if(correlations_row.length != number_of_assets) { errors.push('[' + (row+1) + ']: Size of correlations matrix must match number of assets.'); }
		    else
		    {
			for(var column = row; column < number_of_assets; column++)
			{
			    var value = correlations_row.objectAt(column);
			    console.log(value);
			    if(value.value) { value = value.value; }
			    value = parseFloat(value);

			    if(isNaN(value) || value < 0 || value > 100)
			    {
				errors.push('[' + (row+1) + '][' + (column+1) + "]: Correlations must be in [0;100].");
			    }
			}
		    }
		}
	    }
	}

	for(var asset = 0; asset < this.get('assets.length'); asset++)
	{
	    var asset_errors = this.get('assets').objectAt(asset).validate();
	    for(var i = 0; i < asset_errors.length; i++)
	    {
		errors.push('Asset ' + (asset+1) + ': ' + asset_errors[i]);
	    }
	}
	
	return errors;
    },
});

App.Asset = DS.Model.extend({
    option: DS.belongsTo('option'),

    index: DS.attr('number'),

    start_price: DS.attr('number'),
    volatility: DS.attr('number'),

    validate: function() {
	var errors = [];

	if(isNaN(parseFloat(this.get('start_price'))) || parseFloat(this.get('start_price')) < 0) { errors.push("Asset start prices must be at least 0."); }
	if(isNaN(parseFloat(this.get('volatility'))) || parseFloat(this.get('volatility')) < 0) { errors.push("Asset volatilities must be at least 0."); }

	return errors;
    },
});
