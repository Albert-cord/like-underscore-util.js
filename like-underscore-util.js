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
    var slice = ArrayProto.slice;

    var ObjectProto = Object.prototype;
    var toString = ObjectProto.toString;
    var hasOwnProperty = ObjectProto.hasOwnProperty;

    var nativeIsArray = Array.isArray;
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

    var builtinIteratee = _.iteratee = function (value, context) {
        return cb(value, context);
    }
    var noop = function() {};
    var log = console.log.bind();
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

    var restArguments = function(fn) {
        var length = fn && fn.length || 0;

        return function() {
            if (length >= arguments.length && length != 1) {
                return fn.apply(this, [].slice.call(arguments));
            } else {
                var args = Array(length);
                for(var i = 0; i < length - 1; i++) {
                    args[i] = arguments[i];
                }
                args[i] = [].slice.call(arguments, length - 1);

                return fn.apply(this, args);
            }
        }
    }

    _.identity = function(value) {
        return value;
    };

    _.property = function(path) {
        if(!_.isArrayLike(path)) {
            return shallowProperty(path);
        } else {
            return _.deepGet(path)
        }
    }

    _.deepGet = function(propArray) {
        return function(obj) {
            if(_.isObject(obj)) {
                for (var i = 0; i < propArray.length; i++) {
                    obj && (obj = obj[propArray[i]]);
                }
                return obj;
            }
            return;
        }
    }

    _.propertyOf = function(obj) {
        if(!_.isObject(obj)) return noop;
        return function(path) {
            if(!_.isArrayLike(path)) return obj[path];
            _.each(path, function (p, i, path) {
                obj && (obj = obj[p]);
            })
            return obj;
        }
    }

    _.matcher = function(attrs) {
        attrs = _.extend({}, atrrs);
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
        var isArray = _.isArrayLike(list);
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
        
        return result;

    }

    _.every = function(list, iteratee, context) {
        iteratee = cb(iteratee, context);
        var isArray = _.isArrayLike(list);
        var i, keys;
        if (isArray) {
            for(i = 0; i < list.length; i++) {
                if (!iteratee(i, list[i], list)) {
                    return false;
                }
            }
        } else {
            keys = _.keys(list);
            for (i = 0; i < keys.length; i++) {
                if(!iteratee(keys[i], list[keys[i]], list)) {
                    return false;
                }
            }
        }
        return true;
    };

    _.some = function (list, iteratee, context) {
        iteratee = cb(iteratee, context);
        var isArray = _.isArrayLike(list);
        var i, keys;
        if (isArray) {
            for (i = 0; i < list.length; i++) {
                if (iteratee(i, list[i], list)) {
                    return true;
                }
            }
        } else {
            keys = _.keys(list);
            for (i = 0; i < keys.length; i++) {
                if (iteratee(keys[i], list[keys[i]], list)) {
                    return true;
                }
            }
        }
        return false;
    };



    // double closure will cause args undefined
    var createAssigner = function(keysFn, isOverride) {
        return function (obj) {
            // why underscore use under
            // to change the primite to object
            if(!isOverride) obj = Object(obj);
            var args = slice.call(arguments, 1);
            if(args.length === 0 || obj === void 0) return obj;
            _.each(args, function(source, i, sources) {
                var keys = keysFn(source);
                for(var i = 0, key; i < keys.length, key = keys[i]; i++) {
                    if(isOverride || obj[key] === void 0) {
                        obj[key] = source[key];
                    }
                }
            })
            return obj;
        }
    }

    //why not wrap a function to Aop and to void check arguments[1]'s value
    //to do it.
    // _.extends = _.assign =  function(target) {
    //     var length = arguments.length;
    //     if(length < 2 || target == null) return target;
    //     var deep = 'boolean' === typeof arguments[1] ? arguments[1] : 'nope';
    //     var i = 'nope' === deep ? 1 : 2;
    //     deep = 'nope' === deep ? false : deep;
    //     for(; i < length; i++) {
    //         for(var prop in arguments[i]) {
    //             if (has(arguments[i], prop) && (!target[prop] || deep)) {
    //                 target[prop] = arguments[i][prop];
    //             }
    //         }
    //     }
    //     return target;
    // }
    


    _.functions = function(obj) {
        var arr = [];
        for (var prop in obj) {
            if (hasOwnProperty.call(obj, prop) && _.isFunction(obj[prop])) {
                arr.push(prop);
            }
        }
        return arr.sort(); /* 这里真的有必要sort？ */
    };

    _.wrapperByArgsNumber = function(fn, mode) {
        return function(target) {
            if (arguments.length <= 1) {
                return fn.call(null, target);
            } else {
                if(mode === !0) {
                    return _.every(arguments, function (i, arg) {
                        return fn.call(null, arg);
                    })
                } else {
                    return _.some(arguments, function (i, arg) {
                        return fn.call(null, arg);
                    })
                }
            }
        }
    };

    _.isObjectTypeFn = function (typeStr) {
        return function(target) {
            return toString.call(target) === '[object ' + typeStr + ']';
        }
    }

    _.each(['Arguments', 'Function', 'String', 
    'Number', 'Date', 'Symbol', 
    'RegExp', 'Error', 'Map', 
    'WeakMap', 'Set', 'WeakSet'], function (params) {
        _[params] = _.wrapperByArgsNumber(_.isObjectTypeFn(params), true);
    })

    // _.isFunction = _.wrapperByArgsNumber(function (func) {
    //     return typeof func === 'function' || false;
    // }, true);

    // _.isNumber = _.wrapperByArgsNumber(function (num) {
    //     return typeof (num) === 'number' || toString.call(num) == '[object Number]';
    // }, true);

    _.isObject = _.wrapperByArgsNumber(function (obj) {
        return typeof obj == 'object' && toString.call(obj) == '[object Object]';
    }, true);

    _.isArray = _.wrapperByArgsNumber(function (obj) {
        return nativeIsArray && nativeIsArray(obj) || toString.call(obj) == '[object Array]';
    }, true);

    _.isObjectLike = _.wrapperByArgsNumber(function (obj) {
        return typeof obj === 'object' && obj !== null;
    }, true)

    _.isDeepEqual = function (obj, other) {
        // how to easy to check isEqual?
        // only property ?or prototype ?
        // to check prototype chain 
        if(_.isObject(obj, other)) {

            return obj == other || (function(obj, other) {
                var checkedObj = [];
                var objKeys = _.allKeys(obj);
                var otherKeys = _.allKeys(other);
                log(objKeys, otherKeys)
                if(objKeys.length !== otherKeys.length) return false;
                for(var i = 0, o, ot; i < objKeys.length, o = obj[objKeys[i]], ot = other[otherKeys[i]]; i++) {
                    if(checkedObj.indexOf(o) !== -1 && checkedObj.indexOf(o) !== -1 && o != ot) {
                        checkedObj = null;
                        return false;
                    } 
                    if(_.isObjectLike(o, ot) && (checkedObj.push(o, ot), !_.isDeepEqual(o, ot))) {
                        checkedObj = null;                        
                        return false;
                    } else {
                        checkedObj = null;
                        if(!_.isObjectLike(o) && !_.isObjectLike(ot) && ot !== o) {
                            checkedObj = null;
                            return false
                        } else {
                            checkedObj = null;
                            return false;
                        }
                    }
                }
                return true;
            })(obj, other)        
        } else {
            return obj === other;
        }

    }

    var shallowProperty = function(prop) {
        return function(obj) {
            return  obj && obj[prop];
        }
    }

    _.isArrayLike = _.wrapperByArgsNumber(function (obj) {
        if(typeof obj === 'object' && obj !== null) {
            var length = shallowProperty('length')(obj);
            if (0 <= length && MAX_ARRAY_INDEX >= length) return true;
        }
        return false;
    })

    _.isArray = _.wrapperByArgsNumber(function (obj) {
        var isArray = Array.isArray;
        if (isArray)
            return isArray(obj);
        else {
            var length = shallowProperty('length')(obj);
            if (0 <= length && MAX_ARRAY_INDEX >= length) return true;
        }
        return false;
    }, true);

    var has = function(obj, prop) {
        return hasOwnProperty.call(obj, prop);
    };

    _.isEmpty = _.wrapperByArgsNumber(function (obj) {
        if(_.isArrayLike(obj)) {
            for(var prop in obj) {
                if(has(obj, prop)) {
                    if(prop !== 'length') return false;
                }
            }
            return obj.length === 0;
        }
        if(_.isObject(obj)) {
            for(var prop in obj) {
                if(has(obj, prop)) {
                    return false;
                }
            }
            return true;
        }
    });

    _.isElement = _.wrapperByArgsNumber(function (node) {
        if(typeof HTMLElement === 'object') return node instanceof HTMLElement;
        return _.isObjectLike(node) && node.nodeType === 1 && typeof node.nodeName === 'string'
    });

//    _.isArguments = _.wrapperByArgsNumber(function (args) {
//     return _.isArrayLike(args) && (typeof args.callee === 'function')
//     }, true);

    // _.isString = _.wrapperByArgsNumber(function (str) {
    //     return typeof str === 'string' || _.isObjectTypeFn('String')(str);
    // }, true);

    _.isNaN = function (num) {
        if(isNaN) return _.isNumber(num) && isNaN(num);
        return num !== num;
    }

    // _.isSymbol = function (symbol) {
    //     return typeof symbol === 'symbol' || _.isObjectTypeFn('Symbol')(symbol);
    // }
    //why parseFloat num?
    _.isFinite = function (num) {
        return !_.isSymbol(num) && isFinite(num) && !isNaN(parseFloat(num));
    }

    _.isBoolean = function (boolean) {
        return typeof boolean === 'boolean' || _.isObjectTypeFn('Boolean')(boolean);
    }

    _.isNull = function (obj) {
        return obj === null;
    };

    _.isUndefined = function (obj) {
        return obj === undefined;
    }



    _.keys = _.objects = function(obj) {
        if(!_.isObject(obj)) return [];
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
        if (!_.isObject(obj)) return [];
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

    _.extend = createAssigner(_.allKeys, true);
    
    _.extendOwn = createAssigner(_.keys, true);

    // how to make a pretty function to create pick and omit? 
    // var createPickOmitFn = function(isPickFn) {

    // }

    _.pick = restArguments(function(obj, keys) {
        var keyArr = _.keys(obj), iteratee, result = Object.create(null);
        if(typeof keys === 'function') {
            iteratee = keys;
            
            _.each(keyArr, function(key, i, keyArr) {
                if(iteratee(obj[key], key, obj)) result[key] = obj[key];
            });
        } else {
            keys = typeof keys === 'string' ? Array(keys) : keys;

            _.each(keys, function(key, i, keys) {
                if(keyArr.indexOf(key) !== -1) {
                    result[key] = obj[key];
                }
            })
        }
        return result;
    })

    _.omit = restArguments(function(obj, keys) {
        var keyArr = _.keys(obj), iteratee, result = Object.create(null);
        if(typeof keys === 'function') {
            iteratee = keys;
            
            _.each(keyArr, function(key, i, keyArr) {
                if(!iteratee(obj[key], key, obj)) result[key] = obj[key];
            });
        } else {
            keys = typeof keys === 'string' ? Array(keys) : keys;
            _.each(keys, function(key, i, keys) {
                if(keyArr.indexOf(key) == -1) {
                    result[key] = obj[key];
                }
            })
        }
        return result;
    })

    _.defaults = restArguments(function (obj, args) {
        return createAssigner(_.keys, false)(obj, args)
    });

    _.clone = function (obj) {
        if(_.isObject(obj)) {
            return _.extend({}, obj);
        }
        if(_.isArray(obj)) {
            return obj.slice();
        }
        return obj;
    };

    _.tap = function (obj, interceptor) {
        interceptor = cb(interceptor);
        //the interceptor will influence obj ?
        if(_.isObject(obj) || _.isArrayLike(obj)) interceptor(obj);
        return obj;
    }



    _.values = function(obj) {
        var keys = _.keys(obj);
        var result = [];
        if(keys.length === 0) return result;
        return _.map(keys, function(key) {
            return obj[key];
        })
    }

    _.mapObject = function(obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        // var result = {};
        var result = Object.create(null);
        var keys = _.keys(obj);
        _.each(keys, function(key, i, keys) {
            result[key] = iteratee(obj[key], key, obj);
        })
        return result;
    }

    _.pairs =  function (obj) {
        var result = [];
        var keys = _.keys(obj);
        // var pair = [];
        if(keys.length === 0) return result;
        _.each(keys, function(key, i) {
            result.push([key, obj[key]]);
        })
        return result;
    }

    //how to serializable the val of the key;
    _.invert = function (obj) {
        var result = Object.create(null);
        var keys = _.keys(obj);
        if(keys.length === 0) return result;
        _.each(keys, function(key, i) {
            result[obj[key]] = key;
        })
        return result;
    }

    _.create = function (prototype, props) {
        var result = Object.create(prototype || null);
        var keys = _.keys(props);
        if(keys.length === 0) return result;
        _.each(keys, function(key, i) {
            result[key] = props[key];
        })
        return result;
    }

    _.findKey = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = _.keys(obj);
        if(keys.length === 0) return;
        for(var i = 0; i < keys.length; i++) {
            if(predicate(obj[key[i]], key[i], obj)) {
                return key[i];
            }
        }
    }


    _.debounce = function(fn, delay, immediate) {
        var timer = null;
        var immediate = immediate || false;
        var result;

        var debounce = function() {
            var context = this;
            var args = [].slice.apply(arguments);
            if(false !== immediate) {
                if(timer) clearTimeout(timer);
                result = fn.apply(context, args);
                immediate = false;

                timer = setTimeout(function () {
                    result = fn.apply(context, args);
                }, delay);

                return result;
            }

            if(timer) clearTimeout(timer);

            timer = setTimeout(function() {
                //result can't to return...
                result = fn.apply(context, args);
            }, delay);

        };

        debounce.reset = function (immediate) {
            immediate = immediate || false;
        };
        debounce.cancell = function () {
            clearTimeout(timer);
            timer = null;
        };
    };

    _.throttle = function(fn, delay, options) {
        var timer, context, args, result, previous;
        var options = options || {
            leading: true,
            trailing: true
        };

        var throttle = function() {
            var now = new Date().getTime();
            // previous = 0 cause fn run immediately;
            if (previous === undefined) previous = 0;
            //  = now cause fn can't run immediately;
            if (!previous && options.leading !== false) previous = now;
            var remaining = delay - (now - previous);
            if (remaining <= 0 || remaining > delay) {
                //if enter delay limits clearTimeout remove trailing effect;
                if(timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                context = this;
                args = [].slice.call(arguments);
                result= fn.apply(context, args);
                previous = now;
                return result;

            } else if(!timer && options.trailing !== false) {
                // trailing effect caused by setTimeout
                timer = setTimeout(function() {
                    fn.apply(context, args);
                    context = args = null;
                }, remaining);
            }
        };

        throttle.cancell = function() {
            previous = now;
            clearTimeout(timer);
            timer = null;
        };

        throttle.reset = function (options) {
            previous = 0;
            options = options || {
                leading: true,
                trailing: true
            };
        };
    };

    _.once = function(fn) {
        return function() {
            var context = this;
            var args = [].slice.call(arguments);
            var result;
            if(fn) {
                result = fn.apply(context, args);
                fn = null;
                return result;
            }
        }
    };

    _.after = function(count, fn) {
        var initCount = 0;
        if (!_.isNumber(count)) return noop;
        return function() {
            var context = this;
            var args = [].slice.call(arguments);
            initCount++;
            if (initCount === count && fn) {
                var result = fn.apply(context, args);
                fn = null;
                return result;
            }
        }
    };

    _.before = function(count, fn) {
        var initCount = 0;
        if (!_.isNumber(count)) return noop;
        return function () {
            var context = this;
            var args = [].slice.call(arguments);
            initCount++;
            if (initCount <= count && fn) {
                var result = fn.apply(context, args);
                return result;
            } else {
                fn = null;
            }
        }
    };

    _.wrap = function(fn, wrapper) {
        if(!_.isFunction(fn, wrapper)) return noop;
        return function() {
            return wrapper(fn);
        }
    }

    //negate the type not the value ?
    //But undefined and null and NaN is not to negate
    //Number and NaN is not to negate
    _.negateType = function(type) {
        return _.wrapperByArgsNumber(function (target) {
            if (_.isFunction(type)) {
                try {
                    //however, is something hasn't constructor ?
                    if (target === undefined) return false;
                    return target.constructor === type
                } catch (error) {
                    return target == undefined                        
                }
            }
            try {
                type = type.prototype.constructor
            } catch (error) {
                type = undefined;
            }
            if (type !== undefined) {
                console.log(target.prototype.constructor, type);
                return target.prototype.constructor === type
            } else {
                return target == type;
            }
        }, true)
    };

    _.negate = function(predicate) {
        return _.wrapperByArgsNumber(function () {
            return !predicate.apply(this, arguments);
        }, true);
    };



    _.restArguments = restArguments;

    _.compose = _.restArguments(function (fns) {
        return _.restArguments(function (args) {
            var ret;
            var i = fns.length - 1
            console.log(args);
            i >= 0 &&　(ret = fns[i].apply(this, args));
            for (var i = fns.length - 2; i >= 0; i--) {
                console.log(ret);
                ret = fns[i].call(this, ret);
            }
            return ret;
        })
    })


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
        fnArrs && fnArrs.forEach(fn => {
            typeof fn === 'function' && fn();
        });
    };

    _.mixins(_);

})()