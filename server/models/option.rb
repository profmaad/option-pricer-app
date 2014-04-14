class Option
  include Mongoid::Document

  embeds_many :assets

  field :type, type: String
  field :direction, type: String
  field :control_variate, type: String

  field :timestamp, type: DateTime

  field :priced, type: Boolean

  field :strike_price, type: Float
  field :maturity, type: Float
  field :risk_free_rate, type: Float

  field :correlations, type: Array

  field :price, type: Float
  field :confidence_interval, type: Array
  field :samples, type: Integer

  def to_ember_json
    option_json = {}
    assets_json = []

    option_json['id'] = self._id.to_s
    
    option_json['type'] = self.type
    option_json['direction'] = self.direction
    option_json['control_variate'] = self.control_variate

    option_json['timestamp'] = self.timestamp.to_s

    option_json['priced'] = self.priced

    option_json['strike_price'] = self.strike_price
    option_json['maturity'] = self.maturity
    option_json['risk_free_rate'] = self.risk_free_rate

    option_json['price'] = self.price
    option_json['confidence_interval'] = self.confidence_interval
    option_json['samples'] = self.samples

    if(self.correlations)
      correlations_json = self.correlations.map do |row|
        row.map do |value|
          {value: value}
        end
      end
    else
      correlations_json = self.correlations
    end
    option_json['correlations'] = correlations_json

    assets_json = self.assets.map {|asset| asset.to_ember_json}

    option_json['assets'] = assets_json.map {|asset| asset['id']}

    return [option_json, assets_json]
  end
end

class Asset
  include Mongoid::Document

  embedded_in :option
  field :index, type: Integer

  field :start_price, type: Float
  field :volatility, type: Float

  def to_ember_json
    asset_json = {}
    
    asset_json['id'] = self.option._id.to_s + self.index.to_s
    asset_json['index'] = self.index

    asset_json['start_price'] = self.start_price
    asset_json['volatility'] = self.volatility

    return asset_json
  end
end
