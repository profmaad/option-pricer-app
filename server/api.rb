require 'sinatra'
require 'mongoid'
require 'json'

require 'pp'

puts File.expand_path(File.dirname(__FILE__) + '/../client')
set :public_folder, File.expand_path(File.dirname(__FILE__) + '/../client')

require_relative 'models/option'
require_relative 'workers/pricing_worker'

Mongoid.load!('mongoid.yml')

if(false and Option.all.size == 0)
  Option.create([
                 {
                   type: 'european',
                   timestamp: Time.now,
                   strike_price: 100.0,
                   maturity: 3.0,
                   risk_free_rate: 5.0,
                   price: 8.23,
                   confidence_interval: [8.22, 8.24],
                   samples: 10000000,
                   completed: true,
                   priced: true,
                   assets: [{
                              index: 0,
                              start_price: 100,
                              volatility: 30
                            }],
                 },
                 {
                   type: 'asian_arithmetic',
                   timestamp: Time.now - 60,
                   strike_price: 100.0,
                   maturity: 3.0,
                   risk_free_rate: 5.0,
                   averaging_steps: 50,
                   price: 14.547,
                   confidence_interval: [14.5, 14.6],
                   samples: 10000000,
                   completed: true,
                   priced: true,
                   assets: [{
                              index: 0,
                              start_price: 100,
                              volatility: 30
                            }],
                 },
                 {
                   type: 'basket_arithmetic',
                   timestamp: Time.now - 10*60,
                   strike_price: 100.0,
                   maturity: 3.0,
                   risk_free_rate: 5.0,
                   correlations: [[1.0, 0.8, 0.5], [0.8, 1, 0.3], [0.5, 0.3, 1]],
                   price: 23.4242,
                   confidence_interval: [23.4, 23.44],
                   samples: 10000000,
                   completed: true,
                   priced: true,
                   assets: [
                            {
                              index: 0,
                              start_price: 100,
                              volatility: 30,
                            },
                            {
                              index: 1,
                              start_price: 90,
                              volatility: 15,
                            },
                            {
                              index: 2,
                              start_price: 110,
                              volatility: 10,
                            },
                           ],                            
                 },
                ])
end

get '/api/options', :provides => :json do
  content_type :json

  completed_query = (params[:completed] == 'true')

  if(params[:completed])
    options = Option.where(completed: completed_query).desc(:timestamp)
  else
    options = Option.desc(:timestamp)
  end

  options_json = []
  assets_json = []

  options.each do |option|
    option_json, sub_assets_json = option.to_ember_json
    options_json << option_json
    assets_json += sub_assets_json
  end

  pp options_json
  pp assets_json

  puts JSON.pretty_generate({options: options_json, assets: assets_json})

  return {options: options_json, assets: assets_json}.to_json
end
get '/api/options/:id', :provides => :json do
  content_type :json

  option = Option.where(_id: params[:id]).first

  if(option)
    option_json, assets_json = option.to_ember_json
    pp option_json

    return {option: option_json, assets: assets_json}.to_json
  else
    status 404
    return {}.to_json
  end
end

post '/api/options', :provides => :json do
  content_type :json

  json = JSON.parse(request.body.read)
  json = json['option']

  new_assets = json['assets'].map do |asset|
    {
      index: asset['index'].to_i,
      start_price: asset['start_price'].to_f,
      volatility: asset['volatility'].to_f,
    }
  end
  pp new_assets

  new_correlations = json['correlations'].map do |row|
    row.map do |value|
      value['value'].to_f
    end
  end
  pp new_correlations

  new_option = Option.create({
                               type: json['type'],
                               direction: json['direction'],
                               control_variate: json['control_variate'],
                               timestamp: Time.now,
                               priced: false,
                               strike_price: json['strike_price'].to_f,
                               maturity: json['maturity'].to_f,
                               risk_free_rate: json['risk_free_rate'].to_f,
                               averaging_steps: json['averaging_steps'].to_i,
                               correlations: new_correlations,
                               samples: json['samples'].to_i,
                               assets: new_assets,
                             })

  PricingWorker.perform_async(new_option._id.to_s)

  option_json, assets_json = new_option.to_ember_json
  val = {option: option_json, assets: assets_json}

  return val.to_json
end

delete '/api/options/:id', :provides => :json do
  content_type :json

  Option.find(params[:id]).delete
end
