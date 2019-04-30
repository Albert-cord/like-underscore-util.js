(function() {
    var root = (typeof self == 'object' && self.self == self && self) || (typeof global == 'object'
    && global.global == global && global) || this || {};
    
    var _ = function(obj) {
        if(obj instanceof _) return obj;
        if(!(this instanceof _)) return new _(obj);
        this._wrapped = obj;
    }

    if(typeof exports !== 'undefined' && !exports.nodeType) {
        if(typeof module !== 'undefined' && !module.nodeType && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }
    
    var ArrayProto = Array.prototype;
    var push = ArrayProto.push;

    var ObjectProto = Object.prototype;
    var toString = ObjectProto.toString;
    var hasOwnProperty = ObjectProto.hasOwnProperty;

    var nativeIsArray = Array.isArray;
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

    var builtinIteratee = _.iteratee = function (value, context) {
        return cb(value, context);
    }

    var logOnce = false;

    var cb = function(value, context, argCount) {
        //if _.iteratee is user defined;
        if (_.iteratee != builtinIteratee) return _.iteratee(value, context);
        //if there is not a function, use themself;
        if(!value) return _.identity;
        if(_.isFunction(value)) return optimizeCb(value, context, argCount);
        // If value is the original object, how it work ?
        // turn to use Object to map attributes
        if(_.isObject(value) && !_.isArray(value)) return _.matcher(value);
        return _.property(value);
    }

    var optimizeCb = function (func, ctx, argCount) {
        // no ctx only return func without params
        if(ctx == null) return func;
        // no argCount is the same as with three arguments
        switch(argCount == null ? 3 : argCount) {
            //only one param is a value;
            case 1: return function(value) {
                return func.call(ctx, value);
            };
            //three params is value, index, collection
            //it is always used for map ...
            case 3: return function(value, index, collection) {
                return func.call(ctx, value, index, collection);
            }
            //four params is accumulator, value, index, collection
            //it is always used for reduce ...
            case 4: return function (accumulator, value, index, collection) {
                return func.call(ctx, accumulator, value, index, collection);
            }
        }
        //default with arguments,there is not a good performance 
        return function() {
            return func.apply(ctx, arguments);
        }

    }

    _.identity = function(value) {
        return value;
    }

    _.matcher = function(attrs) {
        attrs = _.extends({}, atrrs);
        return function(obj) {
            return _.isMatch(obj, attrs);
        }
    }

    _.isMatch = function(obj, attrs) {
        if (!_.isObject(obj) && !_.isArrayLike(obj)) return false;
        for(var prop in attrs) {
            if(has(attrs, prop)) {
                if(!obj[prop] && obj[prop] !== attrs[prop]) return false;
            }
        }
        return true;
    }


    var chainsFunc = function(instance, obj) {
        //according _chains config,why chains function do not bring a params:obj ?
        return instance._chains ? _(obj).chains() : obj;
    }

    _.mixins = function(obj) {
        _.each(_.functions(obj), function(funName, index, arr) {
            var func = _[funName] = obj[funName];
            _.prototype[funName] = function() {
                var args = [this._wrapped];
                // this will cause Maximum call stack size exceeded
                // this._chains = true;
                push.call(args, arguments);
                return chainsFunc(this, func.apply(_, args)); /* 这里有必要用_的上下文吗？ */
            }
        })
        return _;
    }

    _.chains = function(obj) {
        // this will cause Maximum call stack size exceeded
        // if(this instanceof _) obj = this._wrapped;
        var instance = _(obj);
        //open chains config
        instance._chains = true;
        return instance;
    }

    //if not put a prototype link, it will on a chains function
    // _.value = function() {
    //     return this._wrapped;
    // }
    _.prototype.value = function () {
        return this._wrapped;
    }

    _.each = function(obj, func, ctx) {
        var iteratee = optimizeCb(func, ctx);
        var isArray = _.isArrayLike(obj);
        var i = 0;
        // var length = isArray ? obj.length : keys.length;
        if(isArray) {
            for(i = 0; i < obj.length; i++) {
                iteratee(obj[i], i, obj);
            }
        } else {
            var keys = _.keys(obj);
            for(i = 0; i< keys.length; i++) {
                iteratee(obj[i], i, obj);
            }
        }
    }

    _.map = function (list, iteratee, context) {
        iteratee = cb(iteratee, context);
        var isArray = _.isArrayLike(obj);
        var i;
        var result = [];
        if (isArray) {
            for (i = 0; i < list.length; i++) {
                result.push(iteratee(list[i], i, list));
            }
        } else {
            var keys = _.keys(obj);
            for (i = 0; i < keys.length; i++) {
                result.push(iteratee(list[keys[i]], i, list));
            }
        }    

    }

    _.extends = _.assign =  function(target) {
        var length = arguments.length;
        if(length < 2 || target == null) return target;
        var deep = 'boolean' === typeof arguments[1] ? arguments[1] : 'nope';
        var i = 'nope' === deep ? 1 : 2;
        deep = 'nope' === deep ? false : deep;
        for(; i < length; i++) {
            for(var prop in arguments[i]) {
                if (has(arguments[i], prop) && (!target[prop] || deep)) {
                    target[prop] = arguments[i][prop];
                }
            }
        }
        return target;
    }

    _.functions = function(obj) {
        var arr = [];
        for (var prop in obj) {
            if (hasOwnProperty.call(obj, prop) && _.isFunction(obj[prop])) {
                arr.push(prop);
            }
        }
        return arr.sort(); /* 这里真的有必要sort？ */
    };

    _.isFunction = function(func) {
        return typeof func === 'function' || false;
    }

    _.isObject = function(obj) {
        return typeof obj == 'object' && toString.call(obj) == '[object Object]';
    }

    _.isArray = function (obj) {
        return nativeIsArray && nativeIsArray(obj) || toString.call(obj) == '[object Array]';
    }

    var shallowProperty = function(prop) {
        return function(obj) {
            return  obj && obj[prop];
        }
    }

    _.isArrayLike = function(obj) {
        var isArray = Array.isArray;
        if(isArray) 
            return isArray(obj);
        else {
            var length = shallowProperty('length')(obj);
            if(0 <= length && MAX_ARRAY_INDEX >= length) return true;
        }
        return false;
    }

    var has = function(obj, prop) {
        return hasOwnProperty.call(obj, prop);
    };
    _.keys = _.objects = function(obj) {
        if(_.isObject(obj)) return [];
        var keys = Object.keys;
        if(keys) {
            return keys(obj);
        }
        var arr = [];
        for (var prop in obj) {
            if (has(obj, prop)) {
                arr.push(prop);
            }
        }
        return arr;
    }

    _.allKeys = _.allObjects = function (obj) {
        if (_.isObject(obj)) return [];
        var keys = Object.keys;
        if (keys) {
            return keys(obj);
        }
        var arr = [];
        for (var prop in obj) {
            arr.push(prop);
        }
        return arr;
    }

    _.onceLog = function (...args) {
        if (logOnce) return;
        console.log('onceLog: ', ...args);
        logOnce = true;
        setTimeout(() => {
            logOnce = false;
        }, 0)
    };

    _.eqLog = function (eqArrs, logArrs, fnArrs) {
        if (eqArrs && Array.isArray(eqArrs) && (eqArrs.length === 0 || eqArrs.length % 2 === 1)) {
            throw new Error('eqLog function arguments must be an array and first one length must be double');
        }
        //how it not a original variable ?
        for (var i = 0; i < eqArrs.length; i += 2) {
            if (eqArrs[i] !== eqArrs[i + 1]) {
                return null;
            }
        }
        console.log('eqLog: ', ...logArrs);
        fnArrs && fnArrs.forEach(fn => fn());
    };

    _.mixins(_);

})()