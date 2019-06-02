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
    
    _.version = '1.0.0'

    var defaultLikeUnderscoreUtil = root._;
    
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
    _.noop = noop;
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

    var shallowProperty = function (prop) {
        return function (obj) {
            return obj && obj[prop];
        }
    }

    var restArguments = function(fn) {
        var length = fn && fn.length || 0;

        return function() {
            if (length >= arguments.length && length != 1) {
                // the last one will not be array
                var args = [].slice.call(arguments);
                // log(args)
                args[args.length - 1] = [args[args.length - 1]];
                // if(args.length === 1) args = [args];
                return fn.apply(this, args);
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

    _.wrapperByArgsNumber = function (fn, mode) {
        return function (target) {
            if (arguments.length <= 1) {
                return fn.call(null, target);
            } else {
                if (mode === !0) {
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

    _.isArrayLike = _.wrapperByArgsNumber(function (obj) {
        if (typeof obj === 'object' && obj !== null) {
            var length = shallowProperty('length')(obj);
            if (0 <= length && MAX_ARRAY_INDEX >= length) return true;
        }
        return false;
    })

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

    _.matcher = _.matches = function(attrs) {
        attrs = _.extend({}, attrs);
        return function(obj) {

            return _.isMatch(obj, attrs);
        }
    }

    _.isMatch = function(obj, attrs) {
        if (!_.isObject(obj) && !_.isArrayLike(obj)) return false;

        for(var prop in attrs) {
            if(has(attrs, prop)) {
                // how it works on reference type?
                if(!has(obj, prop) || obj[prop] !== attrs[prop]) return false;
            }
        }
        return true;
    }


    var chainsFunc = function(instance, obj) {
        //according _chain config,why chains function do not bring a params:obj ?
        return instance._chain ? _(obj).chain() : obj;
    }

    _.mixin = function(obj) {
        _.each(_.functions(obj), function(funName, index, arr) {
            var func = _[funName] = obj[funName];
            _.prototype[funName] = function() {
                var args = [this._wrapped];
                // this will cause Maximum call stack size exceeded
                // this._chain = true;
                push.call(args, arguments);
                return chainsFunc(this, func.apply(_, args)); /* 这里有必要用_的上下文吗？ */
            }
        })
        return _;
    }

    _.chain = function(obj) {
        // this will cause Maximum call stack size exceeded
        // if(this instanceof _) obj = this._wrapped;
        var instance = _(obj);
        //open chain config
        instance._chain = true;
        return instance;
    }

    //if not put a prototype link, it will on a chains function
    // _.value = function() {
    //     return this._wrapped;
    // }
    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value = function () {
        return this._wrapped;
    }

    _.prototype.toString = function() {
        return String(this._wrapped);
    }

    _.each = _.forEach = function(obj, func, ctx) {
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
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }
    }

    _.map = _.collect = function (list, iteratee, context) {
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

    _.every = _.all = function(list, iteratee, context) {
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

    _.some = _.any = function (list, iteratee, context) {
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

    var createReduceFn = function (step) {
        
        return function (list, iteratee, initVariable, context) {
            iteratee = cb(iteratee, context, 4);
            var i = step > 0 ? 0 : list.length - 1;
            if (initVariable == undefined) {
                initVariable = list[i];
                i += step;
            }

            for (; i >= 0 && i < list.length; i += step) {
                initVariable = iteratee(initVariable, list[i], i, list);
            }
            
            return initVariable;
        }
    }

    _.reduce = _.inject = _.foldl = createReduceFn(1);

    _.reduceRight = _.foldr = createReduceFn(-1);


    _.flatten = function (arr, isShallow) {

        if(!_.isArrayLike(arr)) return;

        return _.reduce(arr, function(now, next) {
            if(isShallow) {
                return _.isArray(now) ? now.concat(next) : [now].concat(next);
            } else {
                return _.isArray(now) ? _.flatten(now).concat(_.isArray(next) ? _.flatten(next) : next)
                        : [now].concat(_.isArray(next) ? _.flatten(next) : next);
            }
        })
    };

    _.union = restArguments(function (lists) {
        var ret = [];
        if (!_.isArrayLike(lists)) return;

        lists = _.flatten(lists, true);
        _.each(lists, function (val) {
            if (ret.indexOf(val) === -1) ret.push(val);
        });
        return ret;
    });

    _.intersection = restArguments(function (lists) {
        if (!_.isArrayLike(lists)) return;
        return _.reduce(lists, function (now, next) {
            if (!_.isArrayLike(now)) return _.isArrayLike(next) ? next : [];
            if (!_.isArrayLike(next)) return _.isArrayLike(now) ? now : [];
            return _.filter(now, function (val) {
                return next.indexOf(val) !== -1;
            })
        })
    });

    _.difference = restArguments(function(list, others) {
        list = _.clone(list);
        if(!_.isArrayLike(list)) return;

        return _.reduce(others, function(now, next) {
            if (!_.isArrayLike(now)) return _.isArrayLike(next) ? next : [];
            if (!_.isArrayLike(next)) return _.isArrayLike(now) ? now : [];

            return _.filter(now, function(val) {
                return next.indexOf(val) === -1;
            })
        }, list)
        
    })

    var unzipFn = function (lists) {
        if (!_.isArrayLike(lists)) return;
        var ret = [];
        for (var i = 0; i < lists.length; i++) {
            var list = lists[i];
            if (!_.isArrayLike(list)) continue;
            for (var idx = 0; idx < list.length; idx++) {
                if (!has(ret, idx)) {
                    ret[idx] = [list[idx]]
                } else {
                    ret[idx].push(list[idx]);
                }
            }
        }

        return ret;
    }

    var createZipFn = function(isZip) {
        if(isZip) return restArguments(unzipFn);
        else return unzipFn;
    }

    // o(n*n), how to reduce to o(n) ?
    _.zip = createZipFn(true)

    _.unzip = createZipFn(false);

    _.object = function(keys, values) {
        var lists, ret = {};
        if(!values) lists = keys;
        if(!_.isArrayLike(keys)) return;

        if(!values) {
            _.each(lists, function(list) {
                ret[list[0]] = list[1];
            })
        } else {
            lists = _.zip(keys, values);
            _.each(lists, function (list) {
                ret[list[0]] = list[1];
            })
        }
        return ret;
    }

    _.chunk = function(list, length) {
        if(!length) return list;
        if(!_.isArrayLike(list)) return;
        var ret = [];
        length = typeof length === 'number' ? Math.ceil(length) : 1;
        length = Math.min(length, list.length);
        for(var i = 0; i < list.length; i += length) {
            ret.push(list.slice(i, i + length))
        }
        return ret;
    }

    var createIndexFn = function(dir) {
        return function (list, value, isSorted, fromIndex) {
            if (!_.isBoolean(isSorted)) {
                if(dir === 1) 
                    fromIndex = isSorted || 0;
                else 
                    fromIndex = isSorted || Math.max(list.length - 1, 0);
                isSorted = false;
            }
            if(_.isBoolean(isSorted)) {
                if (dir === 1)
                    fromIndex = fromIndex || 0;
                else
                    fromIndex = fromIndex || Math.max(list.length - 1, 0);
            }
            
            var half;
            // to check
            if(isSorted && dir !== -1) {
                half = Math.floor(list.length / 2);
                for(var i = half; i < list.length; i = half) {
                    if(value < list[i]) {
                        half = Math.floor(half - half / 2);
                    } else {
                        half = Math.floor(half + half / 2);
                    }
                    if(value === list[i])
                    return i;
                }
            } else {
                for (var i = fromIndex; i >= 0 && i < list.length; i += dir) {
                    if (value === list[i])
                    return i;
                }
            }
            return -1;
        }
    }

    _.indexOf = createIndexFn(1);

    _.lastIndexOf = createIndexFn(-1);

    _.sortedIndex = function(list, value, iteratee, context) {
        iteratee = cb(iteratee, context);
        var currentVal = iteratee(value);

        var i = 0, length = list.length;
        while(i < length) {
            var mid = Math.floor((i + length) / 2);
            // fix bug: not mid, is list[mid]
            if(iteratee(list[mid]) < currentVal) i = mid + 1;
            else length = mid;
        }

        return i;
    }

    var createFindIndexFn = function(dir) {
        return function(list, predicate, context) {
            predicate = cb(predicate, context);
            for(var i = dir === -1 ? Math.max(list.length - 1, 0) : 0; i < list.length && i >= 0; i += dir) {

                if(predicate(list[i], i, list)) break;
            }
            return i === list.length ? -1 : i;
        }
    }

    _.findIndex = createFindIndexFn(1);

    _.findLastIndex = createFindIndexFn(-1);

    _.range = function(start, stop, step) {
        if(!_.isNumber(stop)) {
            stop = start || 0;
            start = 0;
        }
        step = step || 1;
        // var tmp;
        var ret = [];
        for (var i = start; start > stop ? i > stop : i < stop; i += step) {
            ret.push(i);
        }
        return ret;
    }


    // how to new instance ?
    _.bind = restArguments(function (fn, obj, args) {
        if(!_.isArray(args)) {
            // fix bug: [undefined]
            // args = [args];
            args = [];
            obj = obj && obj[0];
        }
        return restArguments(function (innerArgs) {

            return fn.apply(obj, args.concat(innerArgs));
        })
    })

    _.bindAll = restArguments(function(obj, methodNames) {
        _.each(methodNames, function(method) {
            if (typeof obj[method] === 'function') {
                obj[method] = _.bind(obj[method], obj)
            }
        })
    })

    // why to place a placeholder ? eg: _
    _.partial = restArguments(function (fn, args) {
        if(!_.isArray(args)) {
            args = [];
            fn = fn && fn[0];
        }
        return restArguments(function(innerArgs) {
            return fn.apply(null, args.concat(innerArgs));
        })
    })

    _.memoize = function(fn, hashFn) {
        // to use lru will avoid stockoverflow
        var cache = {};
        hashFn = cb(hashFn);
        return restArguments(function (args) {

            var key = hashFn(args.join(''))
            if(has(cache, key)) return cache[key];

            return cache[key] = fn.apply(null, args);
        })
    }

    _.delay = restArguments(function (fn, wait, args) {
        if (_.isUndefined(args)) {
            args = [];
            wait = wait && wait[0];
            wait = wait || 0;
        }

        setTimeout(function () {
            fn.apply(null, args);
        }, wait);
    })

    _.defer = restArguments(function(fn, args) {
        if (_.isUndefined(args)) {
            args = [];
            fn = fn && fn[0];
        }

        setTimeout(function() {
            fn.apply(null, args);
        }, 1)
    })

    // double closure will cause args undefined
    var createAssigner = function(keysFn, isOverride) {
        return restArguments(function (obj, args) {
            // why underscore use under
            // to change the primite to object
            if (!isOverride) obj = Object(obj);

            // var args = arguments.slice(1);
            // to create a variable to save ?
            // var args = slice.call(arguments, 1);

            // to fix bug:args is not an array
            // if(!_.isArray(args)) args = [args];
            // log(args)
            if (typeof args === 'undefined' || args.length === 0 || obj === void 0) return obj;
            _.each(args, function (source, i, sources) {
                var keys = keysFn(source);
                for (var i = 0, key; i < keys.length, key = keys[i]; i++) {
                    if (isOverride || obj[key] === void 0) {
                        obj[key] = source[key];
                    }
                }
            })
            return obj;
        })
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
    


    _.functions = _.methods = function(obj) {
        var arr = [];
        for (var prop in obj) {
            if (hasOwnProperty.call(obj, prop) && _.isFunction(obj[prop])) {
                arr.push(prop);
            }
        }
        return arr.sort(); /* 这里真的有必要sort？ */
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
        _['is' + params] = _.wrapperByArgsNumber(_.isObjectTypeFn(params), true);
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

    _.isDeepEqual = _.isEqual = function (obj, other) {
        // how to easy to check isEqual?
        // only property ?or prototype ?
        // to check prototype chain 
        if(_.isObject(obj, other)) {

            return obj == other || (function(obj, other) {
                var checkedObj = [];
                var objKeys = _.allKeys(obj);
                var otherKeys = _.allKeys(other);
                if(objKeys.length !== otherKeys.length) return false;
                for(var i = 0, o, ot; i < objKeys.length; i++) {
                    o = obj[objKeys[i]];
                    ot = other[otherKeys[i]];
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

    _.has = has;

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
    
    _.extendOwn = _.assign = createAssigner(_.keys, true);

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

    // to fix bug: args will be array, but createAssigner cannot to accept only
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

    _.find = _.detect = function (list, predicate, context) {
        predicate = cb(predicate, context);
        var i;
        if(_.isArray(list)) {
            for (i = 0; i < list.length; i++) {
                if (predicate(list[i], i, list)) {
                    return list[i];
                }
            }
        } else {
            var keys = _.keys(list);
            for (i = 0; i < keys.length; i++) {
                if (predicate(list[keys[i]], keys[i], list)) {
                    return list[keys[i]];                    
                }
            }
        }
        return;
    }

    _.filter = _.select = function (list, predicate, context) {
        predicate = cb(predicate, context);
        var ret, i;
        if (_.isArray(list)) {
            ret = [];
            for (i = 0; i < list.length; i++) {
                if (predicate(list[i], i, list)) {
                    ret.push(list[i]);
                }
            }
        } else {
            ret = {}
            var keys = _.keys(list);
            for (i = 0; i < keys.length; i++) {
                if (predicate(list[keys[i]], keys[i], list)) {
                    ret[keys[i]] = list[keys[i]];
                }
            }
        }
        return ret == undefined ? [] : ret;
    }

    var isObjHasProperties = function (obj, properties, keys) {
        if(_.isObject(obj)) return false;
        for (var i = 0, key; i < keys.length; i++) {
            key = keys[i];
            if (!obj[key] || obj[key] !== properties[key]) return false;
        }
        return true;
    }

    _.findWhere = function (list, properties) {
        var keys = _.keys(properties);
        var i;
        if(_.isArray(list)) {
            for(i = 0; i < list.length; i++) {
                if (isObjHasProperties(list[i], properties, keys)) {
                    return list[i];
                }
            }
        } else {
            if (isObjHasProperties(list, properties, keys)) return list;
        }
    }

    _.where = function (list, properties) {
        var keys = _.keys(properties);
        var i, ret = [];
        if (_.isArray(list)) {
            for (i = 0; i < list.length; i++) {
                if (isObjHasProperties(list[i], properties, keys)) {
                    ret.push(list[i]);
                }
            }
        } else {
            if (isObjHasProperties(list, properties, keys)) return [list];
        }
        return ret
    }

    _.reject = function (list, predicate, context) {
        predicate = cb(predicate, context);
        var ret, i;
        if (_.isArray(list)) {
            ret = [];
            for (i = 0; i < list.length; i++) {
                if (!predicate(list[i], i, list)) {
                    ret.push(list[i]);
                }
            }
        } else {
            ret = {}
            var keys = _.keys(list);
            for (i = 0; i < keys.length; i++) {
                if (!predicate(list[keys[i]], keys[i], list)) {
                    ret[keys[i]] = list[keys[i]];
                }
            }
        }
        return ret == undefined ? [] : ret;
    }

    _.contains = _.includes = _.include = function (list, value, fromIndex) {
        var values, index;
        if(_.isArray(list)) {
            fromIndex = fromIndex > 0 ? Math.min(fromIndex, list.length - 1) : 0;
            index = list.indexOf(value);
            if(index >= fromIndex) return true;
        } else {
            values = _.values(list);
            fromIndex = fromIndex > 0 ? Math.min(fromIndex, values.length - 1) : 0;
            index = values.indexOf(value);
            if(index >= fromIndex) return true;
        }
        return false;
    }

    _.without = restArguments(function (list, values) {
        if (values == undefined) values = [values];
        return _.filter(list, function (val) {
            return !_.contains(values, val);
        })
    })

    // how to faster resolve ?
    // to avoid use contains or indexOf,just to distinguish previous variable and now variable;
    _.uniq = _.unique = function (list, isSorted, iteratee, context) {
        if (_.isArrayLike(list)) return;
        if (_.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
        }

        if (iteratee) iteratee = cb(iteratee, context);

        var seen = [];
        var ret = [];

        for (var i = 0; i < list.length; i++) {
            var val = list[i];
            var computed = iteratee ? iteratee(val, i, list) : val;
            if (isSorted || !iteratee) {
                if (!i || seen !== computed) {
                    ret.push(val);
                    // seen = computed;
                }
                // every loop will use
                seen = computed;
            } else if (iteratee) {
                if (!_.contains(seen, computed)) {
                    ret.push(val);
                    seen.push(computed);
                }
            } else if (!_.contains(ret, val)) {
                ret.push(val);
            }
        }

        return ret;
    }


    _.invoke = restArguments(function(list, methodName, args) {
        var result = _.isArray(list) ? [] : {};

        _.each(list, function (val, index, list) {
            // other variable how to operation ?
            typeof val[methodName] === 'function' && (result[index] = val[methodName].apply(null, args));
        })

        return result;
    });

    _.pluck = function (list, propertyName) {
        var result = [];
        if(_.isArray(list)) {
            _.each(list, function(val, index, list) {
                if(_.isObject(val)) {
                    val[propertyName] && (result.push(val));
                }
            })
        }
        return result;
    }

    _.max = function(list, iteratee, context) {
        var maxVal = -Infinity, max, current;
        if(_.isEmpty(list)) return maxVal;
        if(_.isArray(list)) {
            iteratee = cb(iteratee, context);
            _.each(list, function(val, index, list) {
                current = iteratee(val);
                if(current > maxVal) {
                    maxVal = current;
                    max = val;
                }
            })
        }
        return max || maxVal;
    }

    _.min = function(list, iteratee, context) {

        var minVal = Infinity, min, current;
        if(_.isEmpty(list)) return minVal;
        if(_.isArray(list)) {
            iteratee = cb(iteratee, context);
            _.each(list, function(val, index, list) {
                current = iteratee(val);
                if(current < minVal) {
                    minVal = current;
                    min = val;
                }
            })
        }
        return min || minVal;
    }

    _.sortBy = function(list, iteratee, context) {
        var index = 0;
        iteratee = cb(iteratee, context);
        return _.pluck(_.map(list, function(val, idx, list){
            return {
                value: val,
                index: index++,
                criteria: iteratee(val, idx, list)
            }
        }).sort(function(left, right) {
            var a = left.criteria;
            var b = right.criteria;

            if(a !== b) {
                // why a null ?
                if(a > b || a == void 0) return 1;
                if(a < b || b == void 0) return -1;
            }
            return left.index - right.index;
        }), 'value')
    }

    var group = function(behaviorFn) {
        return function(list, iteratee, context) {
            var ret = {}, key;
            iteratee = cb(iteratee, context);
    
            _.each(list, function(val, idx, list) {
                key = iteratee(val, idx, list);
                behaviorFn(key, ret, val)
            })
    
            return ret;
        }
    }

    _.groupBy = group(function(key, ret, val) {
        if(has(ret, key)) {
            ret[key].push(val);
        } else {
            ret[key] = [val];
        }
    })

    _.indexBy = group(function(key, ret, val) {
        ret[key] = val;
    });

    _.countBy = group(function(key, ret, val) {
        if(has(ret, key)) {
            ret[key]++
        } else {
            ret[key] = 1;
        }
    });

    _.sample = function(list, n, isOnlyOne) {
        if(n == null || isOnlyOne) {
            if(!_.isArrayLike(list)) list = _.values(list);
            return list[_.random(list.length)];
        }
        if(!_.isArrayLike(list)) list = _.values(list);
        else list = _.clone(list);
        var j, temp, length = list.length;
        n = Math.max(Math.min(n, length), 0);
        for(var i = 0; i < length; i++) {
            // j = _.random(0, length - i);
            j = _.random(i, length - 1);
            temp = list[i];
            list[i] = list[j];
            list[j] = temp;
        }

        return list.slice(0, n);
    }

    _.shuffle = function(list) {
        return _.sample(list, Infinity);
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

    _.toArray = function(anything) {
        if(_.isObject(anything)) return _.values(anything);
        if(_.isArrayLike(anything)) return _.clone(anything);
        return [anything];
    }

    _.size = function(list) {
        if(_.isObject(list)) return _.values(list).length;
        if(_.isArrayLike(list)) return list.length;
        return;
    }

    _.partition = function(list, iteratee) {
        iteratee = cb(iteratee);
        var ret, keys;
        if(_.isObject(list)) {
            ret = [{}, {}]
            keys = _.keys(list);
            _.each(keys, function(key, i, keys) {
                if(iteratee(list[key], key, list)) {
                    ret[0][key] = list[key];
                } else {
                    ret[1][key] = list[key];
                }
            })
            return ret;
        }
        if(_.isArray(list)) {
            ret = [[], []]
            list = _.clone(list);
            _.each(list, function(val, key, list) {
                if(iteratee(val, key, list)) {
                    ret[0].push(val);
                } else {
                    ret[1].push(val);
                }
            })
            return ret;
        }
        return [[], []];
    }

    _.compact = function(list) {
        return _.partition(list, !_.negate(Boolean))[0];
    }

    _.first = _.head = _.take = function(list, n) {
        if(!_.isArrayLike(list)) return;
        var length = Math.max(list.length, 0);
        if (typeof n !== 'number') n = 1;
        n = n || 1;
        if(n === 1) {
            return list[0];
        } else {
            return list.slice(0, Math.min(n, length));
        }
    }

    _.initial = function(list, n) {
        if (!_.isArrayLike(list)) return;
        var length = Math.max(list.length - 1, 0);
        if (typeof n !== 'number') n = length;
        if (!n) n = n || length;
        else n = Math.max(list.length - n, 0);

        return list.slice(0, Math.min(n, Math.max(list.length, 0)));
    }

    _.last = function(list, n) {
        if (!_.isArrayLike(list)) return;
        var length = Math.max(list.length - 1, 0);        
        if (typeof n !== 'number') n = 1;

        n = n || 1;
        if (n === 1) {
            return list[length];
        } else {
            return list.slice(Math.max(list.length - n, 0), Math.max(list.length, 0));
        }
    }

    _.rest = _.drop = _.tail = function(list, n) {
        if (!_.isArrayLike(list)) return;
        var length = Math.max(list.length - 1, 0);
        if (typeof n !== 'number') n = 1;

        n = n || 1;
        return list.slice(Math.max(n, 0), Math.max(list.length, 0));
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

    _.timeChunk = function(arr, fn, count, context, wait) {
        if(!_.isArray(arr) && !_.isObject(arr)) return;
        count = Math.max(1, count || 8);
        wait = wait || 200;
        fn = cb(fn, context);
        var i = 0, start, length = _.isArray(arr) ? arr.length : _.keys(arr).length;
        arr = _.clone(arr);
        list = _.isArray(arr) ?  arr : _.keys(arr);        
        var chunk = Math.max(1, count);
        var timer;
        var start, loop;

        if(_.isArray(arr)) {
            start = function() {
                for(; i < chunk && i < length; i++) {
                    fn(list[i], i, list);
                }
                i = chunk;
                chunk = Math.min(length, chunk + count);
            }
        } else {
            start = function() {
                for(; i < chunk && i < length; i++) {
                    fn(arr[list[i]], list[i], arr);
                }
                i = chunk;
                chunk = Math.min(length, chunk + count);            
            }                
        }

        loop = function() {
            log(i, chunk, length)
            start();
            timer = setTimeout(function() {
                loop();
                if(length === i) {

                    clearTimeout(timer);
                    timer = null;
                }
            });
        }

        return loop;
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

                return target.prototype.constructor === type
            } else {
                return target == type;
            }
        }, true)
    };

    // how it work ?
    // !predicate.apply(this, arguments)
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
            
            i >= 0 &&　(ret = fns[i].apply(this, args));
            for (var i = fns.length - 2; i >= 0; i--) {

                ret = fns[i].call(this, ret);
            }
            return ret;
        })
    });

    _.noConflict = function () {
        // this cooperation will not cover a variable _ ?
        root._ = defaultLikeUnderscoreUtil
        return this;
        // return defaultLikeUnderscoreUtil;
    };

    _.constant = function (obj) {
        var closureVariable = obj;
        return function() {
            return closureVariable;
        }
    };

    _.times = function (n, iteratee, context) {
        iteratee = cb(iteratee, context);
        for(var i = 0; i < n; i++) {
            iteratee(i+1);
        }
    };

    _.random = function (min, max) {
        if (typeof max === 'undefined') {
            max = min || 0;
            min = 0;
        }
        return Math.floor(Math.random() * Math.floor(max - min));
    };

    var uniqueIdNum = 0;

    _.uniqueId = function (prefix) {
        return ((prefix || '') + uniqueIdNum++);
    }

    var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;'
    }

    var unescapeMap = _.invert(escapeMap);

    var createEscapeFn = function (map) {
        var changeMatchByMap = function (match) {
            return map[match];
        }

        var source = '(?:' + _.keys(map).join('|') + ')';
        var sourceRegExp  = new RegExp(source);
        var replaceSourceRegExp = new RegExp(source, 'g');

        return function (string) {
            string = !string ? '' : '' + string;
            return sourceRegExp.test(string) ? string.replace(replaceSourceRegExp, changeMatchByMap) : string;
        }
    }

    _.escape = createEscapeFn(escapeMap);
    _.unescape = createEscapeFn(unescapeMap);
    
    _.result = function (obj, property, defaultVal) {
        var ret = _.property(property)(obj);
        if(ret !== undefined) {
            return typeof ret === 'function' ? ret.call(obj) : ret;
        } else {
            return typeof defaultVal === 'function' ? defaultVal.call(obj) : defaultVal;
        }
    }

    _.now = Date.now || function() {
        return new Date().getTime();
    }

    _.templateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        // fix bug: not match all <%- %>
        escape: /<%-([\s\S]+?)%>/g
    }

    var noMatch = /(.)^/;

    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    }

    var escapesRexExp = new RegExp(/\\|'|\r|\n|\u2028|\u2029/,'g');

    var replaceEscapes = function (match) {
        return '\\' + escapes[match];
    }

    _.template = function (text, settings, oldSettings) {   
        if(!settings && oldSettings) settings = oldSettings;

        settings = _.defaults({}, settings, _.templateSettings);
        var source = "__source+='";
        var index = 0;

        // use regexp.source not itself.
        // why cannot change under sequence?
        var textRegExp = new RegExp(([(settings.escape || noMatch).source,
            (settings.interpolate || noMatch).source,
            (settings.evaluate || noMatch).source, '$']).join('|'), 'g');
        text.replace(textRegExp, function (match, escape, interpolate, evaluate, offset){
            source += text.slice(index, offset).replace(escapesRexExp, replaceEscapes);
            index = offset + match.length;
            // log(interpolate, escape, evaluate, settings, textRegExp, match, offset)

            // if(evaluate) {
            //     source += "';\n" + evaluate + "\n__source+='";
            //     log('evaluate', source)
            // } else if(interpolate) {
            //     source += "'+\n((__text=(" + interpolate + "))==null?'':__text)+\n'";
            //     log('interpolate', source)
            // } else if(escape) {
            //     // why not directly use _.escape in the function ?
            //     // because it will be a calculator text to escape
            //     // source += "'" + escape ? _.escape(escape) : '' + "'" 
            //     source += "'+\n((__text=(" + escape + "))==null?'':_.escape(__text))+\n";
            //     log('escape', source)
            // }

            // why cannot change under sequence?
            if(escape) {
                source += "'+\n((__text=(" + escape + "))==null?'':_.escape(__text))+\n'";
                // log('escape', source)
            } else if(interpolate) {
                source += "'+\n((__text=(" + interpolate + "))==null?'':__text)+\n'";
                // log('interpolate', source)
            } else if (evaluate) {
                source += "';\n" + evaluate + "\n__source+='";
                // log('evaluate', source)
            }

            return match;
        })
        source += "';\n";

        if(!settings.variable) {
            source = 'with(obj||{}){\n' + source + '}\n';
        }

        source = "var __text, __source='',__j=Array.prototype.join," +
            "print=function(){__source+=__j.call(arguments, '');};\n" +
            source + 'return __source;\n';
        
        var render;
        try {
            render = new Function(settings.variable || 'obj', '_', source);
        } catch (error) {
            // log(source)
            error.source = source;
            throw error;
        }

        var template = function(data) {
            return render.call(this, data, _);
        }

        var arg = settings.variable || 'obj';
        template.source = 'function(' + arg + ') {\n' + source + '}';

        return template;
    }


    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(methodName, i, list) {
        _.prototype[methodName] = function() {
            ArrayProto[methodName].apply(this._wrapped, arguments)
            // why this._wrapped.length === 0, need to delete this._wrapped[0]
            if ((methodName === 'shift' || methodName === 'shift') && this._wrapped.length === 0)
            delete this._wrapped[0];
            return chainsFunc(this, this._wrapped);
        }
    });

    _.each(['concat', 'join', 'slice'], function (methodName, i, list) {
        _.prototype[methodName] = function () {
            // is whether to add chain
            // is itself a chain fun ?
            // so convert to chainFn, if it is then convert chainFn, or convert a unChainFn
            return chainsFunc(this, ArrayProto[methodName].apply(this._wrapped, arguments))
        }
    });


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

    // to do: countLogFn
    _.countLog = function() {
        var logCount = 0;
        return restArguments(function (args) {
            
        })
    }

    var isPropAndIsObject = function (obj, prop) {
        if (!Object.prototype.hasOwnProperty.call(obj, prop)) return false;
        return (typeof obj[prop] === 'object' && Object.prototype.toString.call(obj[prop]) === '[object Object]') || false;
    };

    var __isProxy = Symbol();

    _.proxy = function (proxyTarget, carePropertyRegExpArr, fn, context, args) {
        var _proxySet = new WeakSet();

        fn = cb(fn, context);
        if(!_.isArray(args)) {
            if(!_.isUndefined(args)) {
                args = [args];
            } else {
                args = [];
            }
        }
        if (!_.isArray(carePropertyRegExpArr)) {
            carePropertyRegExpArr = _.isString(carePropertyRegExpArr) ? _.map(carePropertyRegExpArr.split(' '), function(str) {
                return new RegExp(str);
            }) : [''];
        }
        if (!Object.prototype.hasOwnProperty.call(proxyTarget, __isProxy)) {
            proxyTarget[__isProxy] = true;
        }

        for (var prop in proxyTarget) {
            //  && recursionTimes++ < maxRecursionTimes
            if (isPropAndIsObject(proxyTarget, prop)) {
                if (Object.prototype.hasOwnProperty.call(proxyTarget[prop], __isProxy) && proxyTarget[prop][__isProxy]) continue;
                // Reflect.set(proxyTarget, prop, _.proxy(proxyTarget[prop]).proxy);
                proxyTarget[prop] = _.proxy(proxyTarget[prop]).proxy;
            }
        }

        var __proxy = Proxy.revocable(proxyTarget, {

            get(target, property, receiver) {
                if (_.some(carePropertyRegExpArr, function(regExp) {
                    if (!_.isRegExp(regExp) && _.isString(regExp)) {
                        regExp = new RegExp(regExp);
                    }
                    if(_.isRegExp(regExp)) {
                        return regExp.test(property.toString());
                    }
                })) {
                    args.unshift(target, property, value, receiver);
                    fn.apply(context, args);
                }
                // need?
                //  else if (isOpenPlayConsole) {
                //     elseLog({ target: target, property: property, receiver: receiver, mode: 'get' })
                // }
                return Reflect.get(target, property);
                // return target[property];
            },

            set(target, property, value, receiver) {
                if (_.some(carePropertyRegExpArr, function (regExp) {
                    if (!_.isRegExp(regExp) && _.isString(regExp)) {
                        regExp = new RegExp(regExp);
                    }
                    if (_.isRegExp(regExp)) {
                        return regExp.test(property.toString());
                    }
                })) {
                    args.unshift(target, property, value, receiver);
                    fn.apply(context, args);
                }
                Reflect.set(target, property, value, receiver);
                // target[property] = value;
            }

        });

        _proxySet.add(__proxy.revoke.bind(__proxy));

        return {
            proxy: __proxy.proxy,
            revoke() {
                _proxySet.forEach(fn => fn());
            }
        }
    }


    var buildTree = _.buildTree = function (list, fn, context, {children, parent, model}) {
        let temp = {};
        let tree = {};
        children = children || 'children';
        parent = parent || 'parent';
        if(!_.isObject(list) && !_.isArray(list)) return;
        fn = cb(fn,context);
        for (let j in list) {
            if (has(list, j))
                temp[list[j].name] = list[j];
        }
        for (let i in temp) {
            if (!has(temp, i)) continue;

            if (temp[i][parent] && temp[i][parent].length > 0) {
                _.each(temp[i][parent], function (p) {
                    if (temp[p] && !temp[p][children]) {
                        temp[p][children] = {};
                    }
                    // if (!temp[p]) console.log('p, temp[p]', p, temp[p]);
                    //一个类的父亲不能是自己
                    //一个类的子类不能是这个类的父类
                    if (temp[p] && !temp[p][parent]) {
                        temp[p] && p !== temp[i].name
                            && (temp[p][children][temp[i].name] = fn(temp[i]));

                    } else {
                        temp[p] && p !== temp[i].name
                            && (temp[p][parent] && temp[p][parent].indexOf(temp[i].name) == -1)
                            && (temp[p][children][temp[i].name] = fn(temp[i]));
                    }
                })
            } else {
                tree[temp[i].name] = temp[i];
            }
        }
        if (_.isObject(model)) {
            if (!(has(model, utilFunctions) && _.isArray(model.utilFunctions))) {
                model.utilFunctions = [];
            }
            if (!(has(model, relationClasses) && _.isArray(model.relationClasses))) {
                model.relationClasses = [];
            }
            for (let k in tree) {
                if (!has(tree, k)) continue;

                if (tree[k][children] == undefined || (tree[k][children] && tree[k][children].length == 0)) {
                    model.utilFunctions.push(tree[k]);
                } else {
                    model.relationClasses.push(tree[k]);
                }
            }
        }
        return tree;
    }
    var originalPropArr = []

    var FunctionPrototypeCall = Function.prototype.call.bind();
    var FunctionPrototypeApply = Function.prototype.apply.bind();

    _.beforeDetectEnv = function(isDetectFnsRelation) {

        if(isDetectFnsRelation) {
            Function.prototype.call = function (context) {
                var context = context || window;
                context.__fn = this;
                if (context != window) {
                    this.__children = this.__children || [];
                    `${context.__proto__.constructor.name}` !== ''
                        && this.__children.indexOf(`${context.__proto__.constructor.name}`) == -1
                        && `${context.__proto__.constructor.name}` != this.name
                        && this.__children.push(`${context.__proto__.constructor.name}`);

                    context.__proto__.constructor.__parents = context.__proto__.constructor.__parents || [];
                    `${this.name}` !== '' && context.__proto__.constructor.__parents.indexOf(`${this.name}`) == -1
                        && context.__proto__.constructor.name != `${this.name}`
                        && context.__proto__.constructor.__parents.push(`${this.name}`);
                    // console.log(context.__proto__.constructor.__parents.length > 1 ? context.__proto__.constructor.__parents : "");
                }
                var args = [];
                for (var i = 0, len = arguments.length; i < len; i++) {
                    args.push('arguments[' + i + ']');
                }

                var result = eval('context.__fn(' + args + ')');
                delete context.__fn
                return result;
            }

            Function.prototype.apply = function (context, arr) {
                var context = context || window;
                context.__fn = this;

                if (context != window) {
                    this.__children = this.__children || [];
                    `${context.__proto__.constructor.name}` !== ''
                        && this.__children.indexOf(`${context.__proto__.constructor.name}`) == -1
                        && `${context.__proto__.constructor.name}` != this.name
                        && this.__children.push(`${context.__proto__.constructor.name}`);

                    context.__proto__.constructor.__parents = context.__proto__.constructor.__parents || [];
                    `${this.name}` !== '' && context.__proto__.constructor.__parents.indexOf(`${this.name}`) != -1
                        && context.__proto__.constructor.name != `${this.name}`
                        && context.__proto__.constructor.__parents.push(`${this.name}`);
                    // console.log(context.__proto__.constructor.__parents.length > 1 ? context.__proto__.constructor.__parents : "");
                }
                var result;
                if (!arr) {
                    result = context.__fn();
                }
                else {
                    var args = [];
                    for (var i = 0, len = arr.length; i < len; i++) {
                        args.push('arr[' + i + ']');
                    }

                    result = eval('context.__fn(' + args + ')')
                }
                return result;
            }
        }

        for (var _prop in window) {
            if (has(window, _prop) && originalPropArr.indexOf(_prop) === -1) originalPropArr.push(`${_prop}`);
        }
    }

    _.detectEnv = function(isNotLongDetectFnsRelation) {
        var model = {
            classes: [],
            utilFunctions: [],
            relationClasses: [],
            props: {
                vals: [],
                objs: [],
                strs: [],
                nums: [],
                arrs: [],
                bools: [],
                nullAndUndefineds: []
            }
        };
        var _typesForModel;
        originalPropArr.push('_typesForModel', 'model');

        for (var _prop in window) {
            if (Object.prototype.hasOwnProperty.call(window, _prop)
                && originalPropArr.indexOf(`${_prop}`) === -1) {
                if (window[_prop] === null || window[_prop] === undefined) {
                    model['props']['nullAndUndefineds'].push(`${_prop}`);
                    continue;
                }
                _typesForModel = typeof window[_prop];
                // console.log(_typesForModel)
                switch (_typesForModel) {
                    case 'function': {
                        model['classes'].push(`${_prop}`);
                        break;
                    }
                    case 'boolean': {
                        model['props']['bools'].push(`${_prop}`);
                        break;
                    }
                    case 'string': {
                        model['props']['strs'].push(`${_prop}`);
                        break;
                    }
                    case 'number': {
                        model['props']['nums'].push(`${_prop}`);
                        break;
                    }
                    case 'object': {
                        if (Array.isArray(window[_prop])) {
                            model['props']['arrs'].push(`${_prop}`);
                        } else {
                            model['props']['objs'].push(`${_prop}`);
                        }
                        break;
                    }
                    default: {
                        model['props']['vals'].push(`${_prop}`);
                        break;
                    }
                }
            }
        }

        model.retClasses = model.classes.map(name => {
            return {
                name: name,
                parent: window[name].__parents,
                // childs: window[name].__children
            }
        });

        model.rets = buildTree(model.retClasses);
        if (isNotLongDetectFnsRelation) {
            Function.prototype.call = FunctionPrototypeCall;
            Function.prototype.apply = FunctionPrototypeApply;
        }
        return model;
    }

    _.mixin(_);

})()

// to do:test module;
// to do:add to npm packages