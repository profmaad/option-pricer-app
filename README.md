option-pricer-app
=================

Web-based user interface for the OpenCL option pricer

This is a set of components to provide a user interface for the OpenCL option pricer at TODO.

The UI is based on [ember.js](http://emberjs.com/), also using the following components:
* [Bootstrap](http://getbootstrap.com/)
* [Ember Data](https://github.com/emberjs/data)
* https://github.com/nostalgiaz/bootstrap-switch
* https://github.com/seiyria/bootstrap-slider

The API is implemented as a [Sinatra](http://www.sinatrarb.com/) app, also using the following components:
* [Sidekiq](http://sidekiq.org/) for executing the option pricer asynchronously in the background.
* [Mongoid](http://mongoid.org/) for talking to [MongoDB](https://www.mongodb.org/).

Installation
============
The client app brings all its dependencies along for the ride.
To install the dependencies of the Sinatra app, you need Ruby and Bundler. Then do:

```shell
cd option-pricer-app/server
bundle install
```

Then, to start the app, you need to start the sinatra app and at least one sidekiq worker:
```shell
bundle exec rackup config.ru
```
```shell
bundle exec sidekiq -r ./api.rb
```

Note that the sidekiq worker must know the path to the opencl_option_pricer binary. This is set via the constant PRICER_BINARY
at the start of the file server/workers/pricing_worker.rb.

The app can then be accessed at http://localhost:9292/index.html by default.
