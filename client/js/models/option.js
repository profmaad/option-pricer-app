App.Option = DS.Model.extend({
    _id: DS.attr('string'),

    type: DS.attr('string', {defaultValue: 'european'}),
    direction: DS.attr('string', {defaultValue: 'call'}),
    control_variate: DS.attr('string', {defaultValue: 'none'}),

    timestamp: DS.attr('date'),

    strike_price: DS.attr('number'),
    maturity: DS.attr('number'),
    risk_free_rate: DS.attr('number'),

    assets: DS.hasMany('asset', {embedded: 'always'}),
    correlations: DS.attr('array'),
    
    price: DS.attr('number'),
    confidence_interval: DS.attr('array'),
    samples: DS.attr('number', {defaultValue: 6}),

    priced: DS.attr('boolean'),
});

App.Asset = DS.Model.extend({
    option: DS.belongsTo('option'),

    index: DS.attr('number'),

    start_price: DS.attr('number'),
    volatility: DS.attr('number'),
});
