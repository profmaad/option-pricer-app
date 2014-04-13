App.Option = DS.Model.extend({
    _id: DS.attr('string'),

    type: DS.attr('string'),
    direction: DS.attr('string'),
    control_variate: DS.attr('string'),

    timestamp: DS.attr('date'),

    strike_price: DS.attr('number'),
    maturity: DS.attr('number'),
    risk_free_rate: DS.attr('number'),

    assets: DS.hasMany('asset'),
    correlations: DS.attr('array'),
    
    price: DS.attr('number'),
    confidence_interval: DS.attr('array'),
    samples: DS.attr('number'),

    completed: DS.attr('boolean'),
    priced: DS.attr('boolean'),
});

App.Asset = DS.Model.extend({
    option: DS.belongsTo('option'),

    index: DS.attr('number'),

    start_price: DS.attr('number'),
    volatility: DS.attr('number'),
});
