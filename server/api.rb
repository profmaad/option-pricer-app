require 'sinatra'
require 'mongoid'
require 'json'
#require 'sinatra/reloader' if development?

require 'pp'

puts File.expand_path(File.dirname(__FILE__) + '/../client')
set :public_folder, File.expand_path(File.dirname(__FILE__) + '/../client')

require_relative 'models/option'

Mongoid.load!('mongoid.yml')

if(Option.all.size == 0)
  Option.create([
                 {
                   type: 'european',
                   timestamp: Time.now,
                   strike_price: 100.0,
                   maturity: 3.0,
                   risk_free_rate: 5.0,
                   start_prices: [100],
                   volatilities: [30],
                   number_of_assets: 1,
                   correlations: [],
                   price: 8.23,
                   confidence_interval: [8.22, 8.24],
                   samples: 10000000,
                   completed: true,
                   priced: true,
                 },
                 {
                   type: 'asian_arithmetic',
                   timestamp: Time.now - 60,
                   strike_price: 100.0,
                   maturity: 3.0,
                   risk_free_rate: 5.0,
                   averaging_steps: 50,
                   start_prices: [100],
                   volatilities: [30],
                   number_of_assets: 1,
                   correlations: [],
                   price: 14.547,
                   confidence_interval: [14.5, 14.6],
                   samples: 10000000,
                   completed: true,
                   priced: true,
                 },
                 {
                   type: 'basket_arithmetic',
                   timestamp: Time.now - 10*60,
                   strike_price: 100.0,
                   maturity: 3.0,
                   risk_free_rate: 5.0,
                   start_prices: [100, 90, 110],
                   volatilities: [30, 15, 10],
                   number_of_assets: 3,
                   correlations: [[1.0, 0.8, 0.5], [0.8, 1, 0.3], [0.5, 0.3, 1]],
                   price: 23.4242,
                   confidence_interval: [23.4, 23.44],
                   samples: 10000000,
                   completed: true,
                   priced: true,
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

  return {options: options}.to_json
end
get '/api/options/:id', :provides => :json do
  content_type :json

  option = Option.find(params[:id])

  return {option: option}.to_json
end

put '/api/options/:id', :provides => :json do
  content_type :json

  pp params
end

post '/api/options', :provides => :json do
  content_type :json

  json = JSON.parse(request.body.read)

  option = json['option']
  option['timestamp'] = Time.at(option['timestamp'].to_i/1000)

  new_option = Option.create(option)

  return {success: true, option: {_id: new_option._id}}.to_json
end

delete '/api/options/:id', :provides => :json do
  content_type :json


  Option.find(params[:id]).delete
end
