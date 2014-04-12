class Option
  include Mongoid::Document

  field :type, type: String
  field :direction, type: String
  field :control_variate, type: String
  field :timestamp, type: DateTime
  field :completed, type: Boolean
  field :priced, type: Boolean

  field :strike_price, type: Float
  field :maturity, type: Float
  field :risk_free_rate, type: Float

  field :start_prices, type: Array
  field :volatilities, type: Array
  field :correlations, type: Array

  field :number_of_asset, type: Integer

  field :price, type: Float
  field :confidence_interval, type: Array

  field :samples, type: Integer
end
