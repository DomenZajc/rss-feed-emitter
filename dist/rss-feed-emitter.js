'use strict';

// TinyEmitter is a really nice Event Emitter. We will extend
// our main class from it.

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tinyEmitter = require('tiny-emitter');

var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _feedparser = require('feedparser');

var _feedparser2 = _interopRequireDefault(_feedparser);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Lodash is an utility library and makes life easy to work
// and iterate over arrays, objects and manipulate values.


// Request is one of the most popular modules there is to
// make http requests.


// Feedparser is the main choice if you want to parse
// rss feeds in XML.


// Bluebird empowers the default Promise with new
// and amazing methods.


// MAIN CLASS
// This is where we extend from TinyEmitter and absorve
// the #emit and #on methods to emit 'new-item' events
// when we have new feed items.
var RssFeedEmitter = function (_TinyEmitter) {
  _inherits(RssFeedEmitter, _TinyEmitter);

  // The constructor special method is called everytime
  // we create a new instance of this "Class".
  function RssFeedEmitter() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, RssFeedEmitter);

    // Also, we are creating a blank array to keep all
    // our feed objects.
    var _this = _possibleConstructorReturn(this, (RssFeedEmitter.__proto__ || Object.getPrototypeOf(RssFeedEmitter)).call(this));

    // Since this is a "Class", you have to call #super method
    // for the parent class initialize it's internals.


    _this._feedList = [];

    // If the user has specified a User Agent
    // we will use that as the 'user-agent' header when
    // making requests, otherwise we use the default option.
    _this._userAgent = options.userAgent || 'Node/RssFeedEmitter (https://github.com/filipedeschamps/rss-feed-emitter)';

    // This module manages automatically how many feed items
    // it will keep in memory, and basically it will have a
    // maximum history which is how many items the feed has
    // multiplied by this number below. So, if the feed have
    // 10 items, we will keep 30 items max in the history.
    _this._historyLengthMultiplier = 3;

    return _this;
  }

  // PUBLIC METHODS
  // Now we are creating the public methods, these are the
  // ones developers will use in their softwares.
  // Remember: if you change a method signature in a way
  // it's not backwards compatible, you created a breaking
  // change, so design them very well.


  // ADD
  // The #add method is one of the main ones. Basically it
  // receives one parameter with the feed options, for example:
  // {
  //   url: 'http://www.nintendolife.com/feeds/news',
  //   refresh: 2000
  // }

  _createClass(RssFeedEmitter, [{
    key: 'add',
    value: function add(userFeedConfig) {

      // We are going to use a private method to validate
      // the feed object. If it's valid, everything is ok,
      // otherwise it will throw an exception.
      this._validateFeedObject(userFeedConfig);

      // The developer doesn't need to specify the "refresh"
      // property, for example, so this object have the default
      // value.
      var defaultFeedConfig = {
        refresh: 60000
      };

      // With the #defaults method of Lodash, we can merge the user defined
      // values with the default value we defined before.
      var finalFeedConfig = _.defaults(userFeedConfig, defaultFeedConfig);

      // This is a cool private method which will add this new feed if
      // it doesn't exist in our feedList or if it does exist,
      // we will update it.
      this._addOrUpdateFeedList(finalFeedConfig);

      // In the end, return the feedList to the developer.
      return this._feedList;
    }

    // REMOVE
    // This is a very simple method and its functionality is
    // remove a feed from the feedList.

  }, {
    key: 'remove',
    value: function remove(url) {

      // Check if the "url" parameter is a string,
      // otherwise throw.
      if (typeof url !== 'string') {

        throw {
          type: 'type_error',
          message: 'You must call #remove with a string containing the feed url'
        };
      }

      // Try to find the feed object using the
      // private method #_findFeed
      var feed = this._findFeed({
        url: url
      });

      // And then remove the feed object from
      // the feedList.
      return this._removeFromFeedList(feed);
    }

    // LIST
    // Just return the feedList array.

  }, {
    key: 'list',
    value: function list() {

      return this._feedList;
    }

    // DESTROY
    // Remove all feeds from feedList.

  }, {
    key: 'destroy',
    value: function destroy() {

      // There's a gotcha here since we are iterating over an array
      // while removing its properties. To do this, we have to use
      // a little trick where you iterate backwards to not scramble
      // the index while you're removing the properties.
      for (var i = this._feedList.length - 1; i >= 0; i--) {

        var feed = this._feedList[i];

        this._removeFromFeedList(feed);
      }
    }

    // PRIVATE METHODS
    // These methods are not suposed to be used by the developer
    // and you can change them without worrying about compatibilities
    // of the public methods.

    // This is used by the public method #add and will receive
    // a feed object and check if all its properties are valid.
    // If the validation you wan't to make is more complex, I
    // recommend you to use a validation library.

  }, {
    key: '_validateFeedObject',
    value: function _validateFeedObject(feed) {

      if (!feed) {

        throw {
          type: 'type_error',
          message: 'You must call #add method with a feed configuration object.'
        };
      }

      if (!feed.url || typeof feed.url !== 'string' || feed.url === '') {

        throw {
          type: 'type_error',
          message: 'Your configuration object should have an "url" key with a string value'
        };
      }

      if (feed.refresh && typeof feed.refresh !== 'number') {

        throw {
          type: 'type_error',
          message: 'Your configuration object should have a "refresh" key with a number value'
        };
      }
    }

    // This is also used by the public method #add and will
    // add a new feed to feedList or update it if it's
    // already in the list.

  }, {
    key: '_addOrUpdateFeedList',
    value: function _addOrUpdateFeedList(feed) {

      // First, try to find the feed in the feedList.
      var feedInList = this._findFeed(feed);

      // If there's a feed, remove it from the list,
      // since we will add it later again.
      if (feedInList) {

        this._removeFromFeedList(feedInList);
      }

      // Now add the feed in the list.
      return this._addToFeedList(feed);
    }

    // Very simple private method: given a feed object
    // try to find it in the feedList using its "url".

  }, {
    key: '_findFeed',
    value: function _findFeed(feed) {

      return _.find(this._feedList, {
        url: feed.url
      });
    }

    // Given a feed and item, try to find
    // it inside the feed item list. We will use
    // this to see if there's already an item inside
    // the feed item list. If there is, we know it's
    // not a new item.

  }, {
    key: '_findItem',
    value: function _findItem(feed, item) {

      // default object with 'link' and 'title'
      var object = {
        link: item.link,
        title: item.title
      };

      // if feed is RSS 2.x, check existence of 'guid'
      if (item.guid) {

        object = {
          guid: item.guid
        };
      }

      // if feed is Atom 1.x, check existence of 'id'
      if (item.id) {

        object = {
          'id': item.id
        };
      }

      return _.find(feed.items, object);
    }

    // This is where we create the feed itself and
    // add it to the feedList

  }, {
    key: '_addToFeedList',
    value: function _addToFeedList(feed) {

      // First, we add a blank array called "items"
      // to the feed object. This is where we will keep the
      // items history.
      feed.items = [];

      // After this, we will create a setInterval and
      // keep a copy of its reference to be able
      // to clean it later when we remove it.
      // This interval will keep fetching the feed's
      // url for new contents.
      feed.setInterval = this._createSetInterval(feed);

      // In the end, we need to push this object
      // to the feedList array.
      this._feedList.push(feed);
    }

    // This method is a little bit complex
    // but also the most important one. It is
    // responsible to keep fetching the RSS
    // for content and emitting events
    // when new items are found.

  }, {
    key: '_createSetInterval',
    value: function _createSetInterval(feed) {

      // First, lets keep the "this" reference.
      var instance = this;

      // The getContent function will:
      //
      // 1. call the _fetchFeed to get the content
      //    from the RSS feed.
      //
      // 2. Locate the feed object inside the feedList.
      //
      // 3. Redefine the feed history length (using
      //    the _historyLengthMultiplier variable.
      //
      // 4. Sort the received items by date so we always
      //    work with the items in ascending order
      //
      // 5. Given the items received from the last fetch
      //    and the current items in the feed item list,
      //    select only the new ones.
      //
      // 6. Now take the new ones, push them to the
      //    feed item list and emit while emitting events.
      function getContent() {

        // Emit the "fetch-feed-start" event on start.
        instance.emit('fetch-feed-start', feed);

        instance._fetchFeed(feed.url).tap(findFeed).tap(redefineItemHistoryMaxLength).tap(sortItemsByDate).tap(identifyOnlyNewItems).tap(populateNewItemsInFeed).catch(function (error) {

          // If this chain is iterating over a recently
          // deleted feed, it will not be found in the
          // feedList. If this happens, just ignore
          // silently.
          if (error.type === 'feed_not_found') {

            return;
          }

          // Otherwise, emit an "error" event
          instance.emit('error', error);
        });

        // 2. This happens after we got the results from
        // the private method _fetchFeed. Basically we
        // are going to receive a "data" object with
        // the feed URL and the feed content.
        function findFeed(data) {

          // Try to find the feed object inside this instance
          // using the feed url from the fetch.
          var foundFeed = instance._findFeed({
            url: data.feedUrl
          });

          // If nothing is found, probably we destroyed
          // it in the middle of a fetch. Let's throw an
          // error to get out of this Promise chain, since
          // we can't keep going further.
          if (!foundFeed) {

            throw {
              type: 'feed_not_found',
              message: 'Feed not found.'
            };
          }

          // If we found the feed, everything is ok and
          // lets add it to the "data" object.
          data.feed = foundFeed;
        }

        // Since we are managing the max history length,
        // this is a good time to get the items length
        // from the fetched feed, multiply it by the
        // _historyLengthMultiplier and update the
        // feed maxHistoryLength value. This is cool
        // because if the source feed starts to increase
        // or decrese its items quantity, we will ajust
        // automatically how many items we keep in memory.
        function redefineItemHistoryMaxLength(data) {

          var feedLength = data.items.length;

          data.feed.maxHistoryLength = feedLength * instance._historyLengthMultiplier;
        }

        // Sort all received items since we want to
        // emit them in ascending order.
        function sortItemsByDate(data) {

          data.items = _.sortBy(data.items, 'date');
        }

        // Put all new items inside a "newItems" property
        function identifyOnlyNewItems(data) {

          // We can do this using the "filter" method of the array.
          // The logic behind this is, if you return a "false" value,
          // that item will be skipped, but if you return a "true"
          // value, it will be added to the final array.
          data.newItems = data.items.filter(function (fetchedItem) {

            // So, try to find the suposed new item inside the current feed item list.
            var foundItemInsideFeed = instance._findItem(data.feed, fetchedItem);

            // If you found it, that item is not new, so skip it
            // returning a false value.
            if (foundItemInsideFeed) {

              return false;
            }

            // But if we couldn't find it, this means it is a new item and we need
            // to add it to the newItems array. To do this, just return a truthy value.
            return fetchedItem;
          });
        }

        // Now that we have all the new items, add them to the
        // feed item list.
        function populateNewItemsInFeed(data) {

          data.newItems.forEach(function (item) {

            instance._addItemToItemList(data.feed, item);
          });
        }
      }

      // Call the getContent function to already start getting
      // content, otherwise you will have to wait for a
      // setInterval cicle.
      getContent();

      // Create and return the setInterval itself.
      return setInterval(getContent, feed.refresh);
    }

    // This is the inverse of the _addToFeedList method
    // and we will destroy the setInterval and remove
    // the feed from the feedList.

  }, {
    key: '_removeFromFeedList',
    value: function _removeFromFeedList(feed) {

      if (!feed) {

        return;
      }

      clearInterval(feed.setInterval);
      _.remove(this._feedList, { url: feed.url });
    }

    // Add a feed item to its item list.

  }, {
    key: '_addItemToItemList',
    value: function _addItemToItemList(feed, item) {

      // Push them to the items array.
      feed.items.push(item);

      // Keep the max history length in control.
      feed.items = _.takeRight(feed.items, feed.maxHistoryLength);

      // And emit the "new-item" event of this item.
      this.emit('new-item', item);
    }

    // This is where the http request happens.

  }, {
    key: '_fetchFeed',
    value: function _fetchFeed(feedUrl) {
      var _this2 = this;

      // Remember the above Promise chain? Everything starts here.
      return new _bluebird2.default(function (resolve, reject) {

        // Create a FeedParser instance.
        var feedparser = new _feedparser2.default();

        // Create that "data" object we used over and over inside
        // the getContent Promise chain. It starts with a feed url
        // property and a blank item array.
        var data = {
          feedUrl: feedUrl,
          items: []
        };

        // Now let's request that feed URL sending a very nice header
        // because some servers doesn't like requests without it.
        _request2.default.get({
          url: feedUrl,
          headers: {
            'user-agent': _this2._userAgent,
            'accept': 'text/html,application/xhtml+xml,application/xml'
          }
        })
        // Run this once we get a response from the server.
        .on('response', requestOnResponse)
        // If the request is rejected, call this function.
        .on('error', requestOnError)
        // If everything is ok, let's parse the feed.
        .pipe(feedparser)
        // and in the end, let's call the finish function.
        .on('end', finish);

        // Basically what we do here is, if we doesn't get a "200" status
        // code from the request, reject the promise because probably we
        // received something like a "404" or "500" error.
        function requestOnResponse(res) {

          var statusOk = 200;

          if (res.statusCode !== statusOk) {

            var error = {
              type: 'fetch_url_error',
              message: 'This URL returned a ' + res.statusCode + ' status code',
              feed: feedUrl
            };

            reject(error);
          }
        }

        // This will happen when Node.js itself couldn't connet
        // to the host to get something from it.
        function requestOnError(responseError) {

          if (responseError.code === 'ENOTFOUND') {

            var error = {
              type: 'fetch_url_error',
              message: 'Cannot connect to ' + feedUrl,
              feed: feedUrl

            };

            reject(error);
          }
        }

        // Everytime the Feedparser emits a "readable" event
        // we have a new feed item, so we need to add it to the
        // data.item list.
        feedparser.on('readable', function () {

          // Read the item itself.
          var item = feedparser.read();

          // Force the feed URL inside the feed item because
          // some times the RSS doesn't have the feed url inside
          // every item.
          item.meta.link = feedUrl;

          // Add to the data.items.
          data.items.push(item);
        });

        // Feedparser will also emit an "error" event
        // if it's not able to parse the XML. If this
        // happens, we need to interrupt the Promise chain
        // since we can't keep going further.
        feedparser.on('error', function () {

          var error = {
            type: 'invalid_feed',
            message: 'Cannot parse ' + feedUrl + ' XML',
            feed: feedUrl

          };

          reject(error);
        });

        // Once finished, let's resolve the Promise
        // with the "data" object.
        function finish() {

          resolve(data);
        }
      });
    }
  }]);

  return RssFeedEmitter;
}(_tinyEmitter2.default);

// In the end, just export the RssFeedEmitter class.


exports.default = RssFeedEmitter;
module.exports = exports['default'];