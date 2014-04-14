require 'open3'
require 'json'
require 'pp'

require 'mongoid'
require 'sidekiq'

require_relative '../models/option'

PRICER_BINARY = '/home/profmaad/Workspace/opencl-option-pricer/build/opencl_option_pricer'

class PricingWorker
  include Sidekiq::Worker

  def perform(option_id)
    option = Option.find(option_id)
    return unless option
    
    option.processing = true
    option.save

    parameters = pricer_parameters_for_option(option)

    puts
    puts JSON.pretty_generate(parameters)
    puts  

    result_json, errors, status = Open3.capture3(PRICER_BINARY, stdin_data: parameters.to_json)
    puts result_json
    puts errors
    pp status
    result = JSON.parse(result_json)
    
    option.processing = false
    option.priced = true
    option.price = result['mean']
    option.confidence_interval = result['confidence_interval']
    option.save
  end

  def pricer_parameters_for_option(option)
    if(option.is_basket?)
      start_price = []
      volatility = []
      
      option.assets.each do |asset|
        start_price[asset.index] = asset.start_price
        volatility[asset.index] = asset.volatility / 100
      end
    else
      start_price = option.assets[0].start_price
      volatility = option.assets[0].volatility / 100
    end

    correlations = option.correlations.map do |row|
      row.map do |value|
        value.to_f / 100
      end
    end

    parameters = {
      type: option.type,
      direction: option.direction,
      control_variate: (option.control_variate.nil? ? 'none' : option.control_variate),

      strike_price: option.strike_price,
      maturity: option.maturity,
      risk_free_rate: option.risk_free_rate / 100,
      averaging_steps: (option.averaging_steps.nil? ? 1 : option.averaging_steps),

      start_price: start_price,
      volatility: volatility,
      correlation: correlations,

      samples: option.samples
    }

    return parameters
  end
end
