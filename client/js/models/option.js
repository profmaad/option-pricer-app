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
});

App.Asset = DS.Model.extend({
    option: DS.belongsTo('option'),

    index: DS.attr('number'),

    start_price: DS.attr('number'),
    volatility: DS.attr('number'),
});
