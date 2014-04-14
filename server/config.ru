require_relative 'api'

require 'sidekiq/web'


run Rack::URLMap.new('/' => Sinatra::Application, '/sidekiq' => Sidekiq::Web)
