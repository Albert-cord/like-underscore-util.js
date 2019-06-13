(function() {
    // to do:like-underscore --->O
    // to do:add some useful method --->O
    // to do:test module; --->O
    // to do:add CI test module --->O
    // to do:add to npm packages --->O
    var root = typeof self == 'object' && self.self === self && self || typeof global == 'object'
    && global.global === global && global || this || {};


    var defaultLikeUnderscoreUtil = root._;

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
    
    _.VERSION = '1.0.0';

    
    var ArrayProto = Array.prototype;
    var push = ArrayProto.push;
    var slice = ArrayProto.slice;

    var ObjectProto = Object.prototype;
    var toString = ObjectProto.toString;
    var hasOwnProperty = ObjectProto.hasOwnProperty;

    var nativeIsArray = Array.isArray;
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

    var builtinIteratee = _.iteratee = function (value, context) {
        // fix bug:argCount will be set undefined and reset to 3;
        return cb(value, context, Infinity);
    }
    var noop = function() {};
    _.noop = noop;
    var log = console.log.bind();
    var logOnce = false;

    var cb = function(value, context, argCount) {
        //if _.iteratee is user defined;
        if (_.iteratee != builtinIteratee) return _.iteratee(value, context);
        //if there is not a function, use themself;
        if(value == null) return _.identity;
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
            if(prop == null || obj == null) return;
            return obj && obj[prop];
        }
    }
    var getLength = shallowProperty('length');

    var restArguments = function(fn, index) {
        var length = fn && fn.length || 0;

        return function() {
            var args;
            if(_.isNumber(index)) {
                args = [];
                args[index] = [].slice.call(arguments);
                return fn.apply(this, args);
            } else {
                var argLength = arguments.length;
                // 
                if (length > argLength && length != 1) {
                    // the last one will not be array
                    args = [].slice.call(arguments);
                    // log(args)
                    // var pos = Math.max(0, args.length - 1);
                    // if(args.length !== 0) {
                    //     args[pos] = [args[pos]];
                    // }
                    if(args.length < length) {
                        args[length - 1] = [];
                    }
                    // if(args.length === 1) args = [args];
                    return fn.apply(this, args);
                } else {
                    args = Array(length);
                    for(var i = 0; i < Math.max(0, length - 1); i++) {
                        args[i] = arguments[i];
                    }
                    args[i] = [].slice.call(arguments, length - 1);

                    return fn.apply(this, args);
                }
            }
            
        }
    }

    var wrapperByArgsNumber =  _.wrapperByArgsNumber = function (fn, mode) {
        return function (target) {
            if (arguments.length <= 1) {
                return fn.call(null, target);
            } else {
                if (mode === !0) {
                    return _.every(arguments, function (arg, i) {
                        return fn.call(null, arg);
                    })
                } else {
                    return _.some(arguments, function (arg, i) {
                        return fn.call(null, arg);
                    })
                }
            }
        }
    };

    _.isArrayLike = function (obj) {
        if (typeof obj === 'object' && obj !== null) {
            var length = shallowProperty('length')(obj);
            if (typeof length === 'number' && 0 <= length && MAX_ARRAY_INDEX >= length) return true;
        }
        return false;
    };

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
            // if(_.isObject(obj)) {

            // }
            var length = propArray.length;
            if(length === 0) return;
            for (var i = 0; i < length; i++) {
                if(obj && (obj = obj[propArray[i]]));
                else break;
            }
            if(i >= Math.max(length - 1, 0))
                return obj;
            else {
                return obj == null ? undefined : obj;
            }
            // return obj;
            // return;
        }
    }

    _.propertyOf = function(obj) {
        if(!_.isObject(obj)) return noop;
        return function(path) {
            if(!_.isArrayLike(path)) return obj[path];
            _.each(path, function (p, i, path) {
                obj && (obj = obj[p]);
            })
            // why ? obj is null, but directly return null, qunit will read as undefined.
            return obj == null ? null : obj;
        }
    }

    _.matcher = _.matches = function(attrs) {
        // fix bug: spec is restricted to own properties;
        // not for all
        // but for isMatch fn is for empty-Object, so return true
        attrs = _.extendOwn({}, attrs);
        return function(obj) {

            return _.isMatch(obj, attrs);
        }
    }

    _.isMatch = function(obj, attrs) {
        if(obj == null && ((_.isRealObject(attrs) && _.isEmpty(attrs)) || attrs == null)) return true;
        if (!_.isObject(obj) && !_.isArrayLike(obj)) return false;

        for(var prop in attrs) {
            if(has(attrs, prop)) {
                // how it works on reference type?
                if(!(prop in obj) || (has(obj, prop) && obj[prop] !== attrs[prop])) return false;
                // if(!(prop in obj)) {
                //     if(!has(obj, prop) && obj[prop] !== attrs[prop])
                //         return false;
                // }
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
                push.apply(args, arguments);
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
        if(obj == null) return null;
        var isArray = _.isArrayLike(obj);
        var i = 0, length;
        // var length = isArray ? obj.length : keys.length;
        if(isArray) {
            length = obj.length
            for(i = 0; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
        } else {
            var keys = _.keys(obj);
            length = keys.length
            for(i = 0; i< length; i++) {
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }
        return obj;
    }

    _.map = _.collect = function (list, iteratee, context) {
        iteratee = cb(iteratee, context);
        var isArray = _.isArrayLike(list);
        var i, length;
        var result = [];
        if (isArray) {
            length = list.length;
            for (i = 0; i < length; i++) {
                result.push(iteratee(list[i], i, list));
            }
        } else {
            var keys = _.keys(list);
            length = keys.length;
            for (i = 0; i < length; i++) {
                result.push(iteratee(list[keys[i]], keys[i], list));
            }
        }
        
        return result;

    }

    _.every = _.all = function(list, iteratee, context) {
        iteratee = cb(iteratee, context);
        var isArray = _.isArrayLike(list);
        var i, keys, length;
        if (isArray) {
            length = list.length;
            for(i = 0; i < length; i++) {
                if (!iteratee(list[i], i, list)) {
                    return false;
                }
            }
        } else {
            keys = _.keys(list);
            length = keys.length;            
            for (i = 0; i < length; i++) {
                if(!iteratee(list[keys[i]], keys[i], list)) {
                    return false;
                }
            }
        }
        return true;
    };

    _.some = _.any = function (list, iteratee, context) {
        iteratee = cb(iteratee, context);
        var isArray = _.isArrayLike(list);
        var i, keys, length;
        if (isArray) {
            length = list.length;
            for (i = 0; i < length; i++) {
                if (iteratee(list[i], i, list)) {
                    return true;
                }
            }
        } else {
            keys = _.keys(list);
            length = keys.length;
            for (i = 0; i < length; i++) {
                if (iteratee(list[keys[i]], keys[i], list)) {
                    return true;
                }
            }
        }
        return false;
    };

    var createReduceFn = function (step) {
        
        return function (list, iteratee, initVariable, context) {
            var keys = _.isArrayLike(list) ? list.length : _.keys(list);
            if((list == null || list.length === 0 || (keys && keys.length === 0)) && initVariable != null) return initVariable;           
            if(list && (list.length === 1 || (keys && keys.length) === 1)) {
                if(_.isArrayLike(list)){
                    return list[0];
                }
                else {
                    return list[keys[0]];
                } 
            }
            iteratee = cb(iteratee, context, 4);
            var i;
            if(_.isArrayLike(list)) {
                i = step > 0 ? 0 : list.length - 1;
                if (initVariable == undefined) {
                    initVariable = list[i];
                    i += step;
                }
            } else {
                i = step > 0 ? 0 : keys.length - 1;
                if (initVariable == undefined) {
                    initVariable = list[keys[i]];
                    i += step;
                }
            }
            var length = _.isArrayLike(list) ? keys : keys.length;
            for (; i >= 0 && i < length; i += step) {
                if(_.isArrayLike(list)) {
                    initVariable = iteratee(initVariable, list[i], i, list);
                } else {
                    initVariable = iteratee(initVariable, list[keys[i]], keys[i], list);
                }
            }
            
            return initVariable;
        }
    }

    _.reduce = _.inject = _.foldl = createReduceFn(1);

    _.reduceRight = _.foldr = createReduceFn(-1);

    // very low-speed program
    // var getLength = shallowProperty('length');
    // _.flatten = function (arr, isShallow) {
    //     var ret;
    //     if(!_.isArrayLike(arr)) return [];
    //     if(getLength(arr) === 0) return [];
    //     if(getLength(arr) === 1) return _.isArray(arr[0]) ? _.flatten(arr[0]) : arr;
    // is not need to reduce(one, two, one, two, just get a for's cursive)
    //     ret = _.reduce(arr, function(now, next) {
    //         // log(now, next)
    //         if(isShallow) {
    //             return _.isArray(now) ? now.concat(next) : [now].concat(next);;
    //         } else {
    //             return _.isArray(now) ? _.flatten(now).concat(_.isArray(next) ? _.flatten(next) : next)
    //                 : [now].concat(_.isArray(next) ? _.flatten(next) : next);
    //         }
    //     });
    //     return ret;
    // };

    var flatten = function(input, isShallow, isStrict, output) {
        output = output || [];
        if(!_.isArrayLike(input) || input.length === 0) return [];
        var value, idx = output.length;

        for(var i = 0, length = input.length; i < length; i++) {
            value = input[i];
            if(_.isArrayLike(value)) {

                if(isShallow) {
                    var j = 0, valLength = value.length;
                    while(j < valLength) output[idx++] = value[j++];
                } else {
                    flatten(value, isShallow, isStrict, output);
                    idx = output.length;
                }

            } else if(!isStrict) {
                output[idx++] = value;
            }
        }

        return output;
    }

    _.flatten = function(input, isShallow) {
        return flatten(input, isShallow);
    }

    _.union = restArguments(function (lists) {
        var ret = [];
        if (!_.isArrayLike(lists)) return;
        lists = _.filter(lists, function(list) {
            return _.isArrayLike(list);
        })
        lists = _.flatten(lists, true);
        _.each(lists, function (val) {
            if (ret.indexOf(val) === -1) ret.push(val);
        });
        return ret;
    });

    _.intersection = restArguments(function (lists) {
        if (!_.isArrayLike(lists)) return;
        if(_.contains(lists, null)) return [];
        return _.reduce(lists, function (now, next) {
            if (!_.isArrayLike(now)) return _.isArrayLike(next) ? next : [];
            if (!_.isArrayLike(next)) return _.isArrayLike(now) ? now : [];
            if(now.length === 0) {
                _.each(next, function(val) {
                    if(!_.contains(now, val)) {
                        now.push(val);
                    }
                });
                return now;
            } else {
                return _.filter(now, function (val) {
                    // return next.indexOf(val) !== -1;
                    return _.contains(next, val);
                })
            }
        }, [])
    });

    _.difference = restArguments(function(lists) {
        
        if (!_.isArrayLike(lists)) return;
        if(_.contains(lists, null)) return [];
        return _.reduce(lists, function (now, next) {
            if (!_.isArrayLike(now)) return _.isArrayLike(next) ? next : [];
            if (!_.isArrayLike(next)) return _.isArrayLike(now) ? now : [];
            if(now.length === 0) {
                _.each(next, function(val) {
                    if(!_.contains(now, val)) {
                        now.push(val);
                    }
                });
                return now;
            } else {
                return _.filter(now, function (val) {
                    // return next.indexOf(val) !== -1;
                    return !_.contains(next, val);
                })
            }
        }, [])
    })

    var unzipFn = function (lists) {
        if (!_.isArrayLike(lists)) return [];
        var ret = [];
        var maxLength = _.max(lists, function(list) {
            var len = list && list.length;
            return _.isNumber(len) ? len : 0;
        }).length;
        for (var i = 0; i < lists.length; i++) {
            var list = lists[i];
            if (!_.isArrayLike(list)) continue;
            for (var idx = 0; idx < maxLength; idx++) {
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
        if(!_.isArrayLike(keys)) return {};

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
        if(length <= 0 || length == null) return [];
        if(!_.isArrayLike(list)) return;
        var ret = [];
        length = typeof length === 'number' ? Math.ceil(length) : 1;
        length = Math.min(length, list.length);
        for(var i = 0; i < list.length && i >= 0; i += length) {
            ret.push(list.slice(i, i + length))
        }
        return ret;
    }

    
    var createFindIndexFn = function(dir) {
        return function(list, predicate, context) {
            if(!_.isArrayLike(list)) return -1;
            predicate = cb(predicate, context);
            var length = list.length;
            for(var i = dir === -1 ? Math.max(length - 1, 0) : 0; i < length && i >= 0; i += dir) {
                if(predicate(list[i], i, list)) break;
            }
            return i === length ? -1 : i;
        }
    }

    _.findIndex = createFindIndexFn(1);

    _.findLastIndex = createFindIndexFn(-1);

    // neg number!!
    var createIndexFn = function(dir, predicateFind, sortedIndex) {
        return function (list, value, fromIndex) {
            if(!_.isArrayLike(list)) return -1;
            var length = getLength(list), i = 0;
            if (_.isNumber(fromIndex)) {
                if(dir >= 0) 
                    // to set the iterator startedNumber
                    i = fromIndex >= 0 ? fromIndex : Math.max(length + fromIndex, i);
                else
                    // to set the iterator length
                    length = fromIndex >= 0 ? Math.min(fromIndex + 1, length) : fromIndex + length + 1;
            } 
            else             
            // why sequence by sortedIndex , fromIndex, length ?
            if(sortedIndex && fromIndex && length) {
                i = sortedIndex(list, value);
                return list[i] === value ? i : -1;
            }
            // isNaN
            if(value !== value) {
                fromIndex = predicateFind(slice.call(list, i, length), _.isNaN);
                // add the offset
                return fromIndex >= 0 ? fromIndex + i : -1;
            }

            for (i = dir >= 0 ? i : length - 1; i >= 0 && i < length; i += dir) {
                if (value === list[i])
                    return i;
            }
            return -1;
        }
    }

    
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


    _.indexOf = createIndexFn(1, _.findIndex, _.sortedIndex);

    _.lastIndexOf = createIndexFn(-1, _.findLastIndex);


    _.range = function(start, stop, step) {
        if(!_.isNumber(stop)) {
            stop = start || 0;
            start = 0;
        }
        step = step || (start > stop ? -1 : 1);
        // var tmp;
        var ret = [];
        for (var i = start; start > stop ? (i > stop && i <= start) : (i < stop && i >= start); i += step) {
            ret.push(i);
        }
        return ret;
    }


    // how to new instance ?
    _.bind = restArguments(function (fn, obj, args) {
        if(!_.isFunction(fn)) throw new TypeError('must bind to a function');
        if(!_.isArray(args)) {
            // fix bug: [undefined]
            // args = [args];
            args = [];
            obj = obj && obj[0];
        }
        var F = restArguments(function (innerArgs) {
            if (this instanceof F) {
                var ret = fn.apply(this, args.concat(innerArgs));
                // ret.constructor && (ret.constructor = fn);
                return ret;
            } else {
                return fn.apply(obj, args.concat(innerArgs));
            }
        });
        F.prototype = fn.prototype;
        return F;
    })

    _.bindAll = restArguments(function(obj, methodNames) {
        if(!_.isArray(methodNames) || methodNames.length === 0) throw new Error('bingAll must need a function');
        _.each(methodNames, function(method) {
            if(_.isUndefined(obj[method])) throw new TypeError('the given key is undefined');
            if(!_.isFunction(obj[method])) throw new TypeError('the given key is not a function');

            if (typeof obj[method] === 'function') {
                obj[method] = _.bind(obj[method], obj)
            }
        })
    })

    _.partial = restArguments(function (fn, args) {
        if(!_.isArray(args)) {
            args = [];
            fn = fn && fn[0];
        }
        var F = restArguments(function(innerArgs) {
            // fix bug:args will be change in the closure;
            var outterArgs = _.clone(args);
            _.each(outterArgs, function(param, index) {
                if(param === _.partial.placeholder) {
                    if(innerArgs.length !== 0)
                        outterArgs.splice(index, 1, innerArgs.shift());
                    else
                        outterArgs.splice(index, 1, undefined);
                }
            })

            if (this instanceof F) {
                // fix bug: new constructor bind this;
                // var ret = fn.apply(new fn, args.concat(innerArgs));
                var ret = fn.apply(this, outterArgs.concat(innerArgs));
                // log(ret, fn, args.concat(innerArgs))
                return ret;
            } else {
                return fn.apply(this, outterArgs.concat(innerArgs));
            }
        });
        F.prototype = fn.prototype;
        return F;
    });

    // pass test#76:Functions module-partial
    _.partial.placeholder = _;

    _.memoize = function(fn, hashFn) {
        // to use lru will avoid stockoverflow
        hashFn = cb(hashFn);
        var F = restArguments(function (args) {

            var key = hashFn(args.join(''))
            if(has(F.cache, key)) return F.cache[key];

            return F.cache[key] = fn.apply(null, args);
        });
        F.cache = {};
        return F;
    }

    _.delay = restArguments(function (fn, wait, args) {
        if (_.isUndefined(args)) {
            args = [];
            wait = wait && wait[0];
            wait = wait || 0;
        }
        return setTimeout(function () {
            // fix bug: non-return;
            return fn.apply(null, args);
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

            if(obj == null) return obj;

            // var args = arguments.slice(1);
            // to create a variable to save ?
            // var args = slice.call(arguments, 1);

            // to fix bug:args is not an array
            // if(!_.isArray(args)) args = [args];
            // log(args)
            if (obj === void 0) return obj;
            if(!_.isArray(args) && args != null) {
                args = [args];
            }
            _.each(args, function (source, i, sources) {
                var keys = keysFn(source);
                for (var i = 0, key; i < keys.length, key = keys[i]; i++) {
                    // if (isOverride || obj[key] === void 0) {
                    if (isOverride || !has(obj,key)) {
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
            // if (hasOwnProperty.call(obj, prop) && _.isFunction(obj[prop])) {
            if (_.isFunction(obj[prop])) {
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

    // _.each(['Arguments', 'Function', 'String', 
    //     'Number', 'Date', 'Symbol', 
    //     'RegExp', 'Error', 'Map', 
    //     'WeakMap', 'Set', 'WeakSet'], function (params) {
    //     _['isArgs' + params] = _.wrapperByArgsNumber(_.isObjectTypeFn(params), true);
    // });

    _.each(['Arguments', 'Function', 'String', 
        'Number', 'Date', 'Symbol', 
        'RegExp', 'Error', 'Map', 
        'WeakMap', 'Set', 'WeakSet'], function (params) {
        _['is' + params] = _.isObjectTypeFn(params);
    });

    _.isRealObject = function (obj) {
        return typeof obj == 'object' && toString.call(obj) == '[object Object]';
    };

    _.isObject = function (obj) {
        // return typeof obj == 'object' && toString.call(obj) == '[object Object]';
        // why not use toString ? and how function can be a object?
        return (typeof obj == 'object' || typeof obj == 'function') && obj != null;
    };

    _.isArray = function (obj) {
        return nativeIsArray && nativeIsArray(obj) || toString.call(obj) == '[object Array]';
    };

    _.isObjectLike = function (obj) {
        return typeof obj === 'object' && obj !== null;
    };

    var eq = function(a, b, aStack, bStack) {
        // why ? +0, -0 !==, convert to compare Infinity;
        if( a === b ) return a !== 0 || 1 / a === 1 / b;
        // why ?
        if(a == null || b == null) return false;
        if(a !== a) return b !== b;

        var type = typeof a;
        // a is not a function(class) and object,so false
        // b like a
        if(type !== 'function' && type !== 'object' && typeof b !== 'object')
            return false;
        return deepEq(a, b, aStack, bStack);
    }

    var SymbolProto = typeof Symbol.prototype !== 'undefined' ? Symbol.prototype : null;

    var deepEq = function(a, b, aStack, bStack) {
        if(a instanceof _) a = a._wrapped;
        if(b instanceof _) b = b._wrapped;

        var className = toString.call(a);
        if(className !== toString.call(b)) return false;

        switch(className) {
        // use string
        case '[object RegExp]':
        case '[object String]':

            return '' + a === '' + b;
        // use number
        case '[object Number]':
            if(+a !== +a) return +b !== +b;
            return +a === 0 ? 1 / +a === 1 / +b : +a === +b;

        case '[object Date]':
        case '[object Boolean]':
            // use number
            return +a === +b;
        case '[object Symbol]':
            return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
        }

        var areArrays = className === '[object Array]';

        if(!areArrays) {
            // yet not object, so false
            if(typeof a !== 'object' || typeof b !== 'object') return false;

            // compare constructor but not frames's Object or Array

            var aCtor = a.constructor, bCtor = b.constructor;
            if(aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
            _.isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }

        // first time stack init from a empty array;
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while(length--) {
            // if circular-reference
            if(aStack[length] === a) return bStack[length] === b;
        }

        aStack.push(a);
        bStack.push(b);

        if(areArrays) {
            length = a.length;
            if(length !== b.length) return false;
            while(length--) {
                if(!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            var keys = _.keys(a), key;
            length = keys.length;
            if(length !== _.keys(b).length) return false;
            while(length--) {
                key = keys[length];
                if(!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }
        // just for gc?
        aStack.pop();
        bStack.pop();
        return true;
    }

    _.isDeepEqual = _.isEqual = function (obj, other) {
        // how to easy to check isEqual?
        // only property ?or prototype ?
        // to check prototype chain 
        // if(_.isObject(obj, other)) {

        //     return obj == other || (function(obj, other) {
        //         var checkedObj = [];
        //         var objKeys = _.allKeys(obj);
        //         var otherKeys = _.allKeys(other);
        //         if(objKeys.length !== otherKeys.length) return false;
        //         for(var i = 0, o, ot; i < objKeys.length; i++) {
        //             o = obj[objKeys[i]];
        //             ot = other[otherKeys[i]];
        //             if(checkedObj.indexOf(o) !== -1 && checkedObj.indexOf(o) !== -1 && o != ot) {
        //                 checkedObj = null;
        //                 return false;
        //             } 
        //             if(_.isObjectLike(o, ot) && (checkedObj.push(o, ot), !_.isDeepEqual(o, ot))) {
        //                 checkedObj = null;                        
        //                 return false;
        //             } else {
        //                 checkedObj = null;
        //                 if(!_.isObjectLike(o) && !_.isObjectLike(ot) && ot !== o) {
        //                     checkedObj = null;
        //                     return false
        //                 } else {
        //                     checkedObj = null;
        //                     return false;
        //                 }
        //             }
        //         }
        //         return true;
        //     })(obj, other)        
        // } else {
        //     return obj === other;
        // }

        return (obj === other && obj !== 0) || eq(obj, other);

    }

    var has = function(obj, prop) {
        if(obj == null) return false;
        if(!_.isArrayLike(prop))
            return hasOwnProperty.call(obj, prop);
        else {
            var length = prop.length;
            for(var i = 0; i < length; i++) {
                if(hasOwnProperty.call(obj, prop[i])) {
                    obj = obj[prop[i]];
                    if(obj != null)
                        continue;
                }
                return false;
            }
            return true;
        }
    };

    _.has = has;

    _.isEmpty = function (obj) {
        if(obj == null) return true;
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
        if(_.isString(obj)) return obj.length === 0;
        if(_.isRegExp(obj)) return obj.source === "(?:)";
    };

    _.isElement = function (node) {
        if(typeof HTMLElement === 'object') return node instanceof HTMLElement;
        return _.isObjectLike(node) && node.nodeType === 1 && typeof node.nodeName === 'string'
    }

    _.isNaN = function (num) {
        if(isNaN) return _.isNumber(num) && isNaN(num);
        return num !== num;
    }

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
        // fix bug:no use for no-object;
        if (obj == null || _.isString(obj)) return [];
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
        // fix bug:no use for no-object;
        if (obj == null || _.isString(obj)) return [];
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
        if(obj == null) return result;
        if(typeof (keys && keys[0])  === 'function') {
            iteratee = cb(keys[0], keys[1]);
            _.each(keyArr, function(key, i, keyArr) {
                if(iteratee(obj[key], key, obj)) result[key] = obj[key];
            });
        } else {
            // iteratee = cb();
            keys = _.flatten(keys);
            _.each(keys, function(key, i, keys) {
                if(has(obj, key) || obj[key] != null)
                    result[key] = obj[key];
                // if(iteratee(obj[key], key, obj)) result[key] = obj[key];
            })
        }
        return result;
    })

    _.omit = restArguments(function(obj, keys) {
        var keyArr = _.keys(obj), iteratee, result = Object.create(null);
        if(obj == null) return result;
        var isArrayLike = _.isArrayLike(obj);
        if(typeof (keys && keys[0]) === 'function') {
            iteratee = cb(keys[0], keys[1]);
            _.each(keyArr, function(key, i, keyArr) {
                if(!iteratee(obj[key], key, obj)) result[key] = obj[key];
            });
        } else {
            keys = _.flatten(keys);

            if(isArrayLike) {
                for(var key in obj) {
                    if(!_.contains(keys, Number(key))) {
                        result[key] = obj[key];
                    }
                }
            } else {
                for(var key in obj) {
                    if(!_.contains(keys, key)) {
                        result[key] = obj[key];
                    }
                }
            }


            // _.each(obj, function(val, key, obj) {
            //     if(!_.contains(keys, key)) {
            //         result[key] = obj[key];
            //     }
            // })
        }
        return result;
    })

    // to fix bug: args will be array, but createAssigner cannot to accept only
    _.defaults = createAssigner(_.keys, false);

    _.clone = function (obj) {
        if(_.isRealObject(obj)) {
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
        if(_.isObject(obj) || _.isArrayLike(obj) || obj != null) interceptor(obj);
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
        if(!_.isObject(prototype) && !_.isArrayLike(prototype)) return Object.create(null);
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
        var i,length;
        if(_.isArray(list)) {
            length = list.length;
            for (i = 0; i < length; i++) {
                if (predicate(list[i], i, list)) {
                    return list[i];
                }
            }
        } else {
            var keys = _.keys(list);
            length = keys.length;
            for (i = 0; i < length; i++) {
                if (predicate(list[keys[i]], keys[i], list)) {
                    return list[keys[i]];                    
                }
            }
        }
        return;
    }

    _.filter = _.select = function (list, predicate, context) {
        predicate = cb(predicate, context);
        var ret, i, length;
        if (_.isArrayLike(list)) {
            ret = [];
            length = list.length;
            for (i = 0; i < length; i++) {
                if (predicate(list[i], i, list)) {
                    ret.push(list[i]);
                }
            }
        } else {
            // why return a array instead of object?
            // ret = {};
            ret = [];
            var keys = _.keys(list);
            length = keys.length;
            for (i = 0; i < length; i++) {
                if (predicate(list[keys[i]], keys[i], list)) {
                    // ret[keys[i]] = list[keys[i]];
                    ret.push(list[keys[i]]);                    
                }
            }
        }
        return ret == undefined ? [] : ret;
    }

    var isObjHasProperties = function (obj, properties, keys) {
        // if(!_.isObject(obj)) return false;
        for (var i = 0, key; i < keys.length; i++) {
            key = keys[i];
            if (!has(obj, key) || obj[key] !== properties[key]) return false;
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
        var ret, i, length;
        if (_.isArray(list)) {
            ret = [];
            length = list.length;
            for (i = 0; i < length; i++) {
                if (!predicate(list[i], i, list)) {
                    ret.push(list[i]);
                }
            }
        } else {
            ret = {}
            var keys = _.keys(list);
            length = keys.length;
            for (i = 0; i < length; i++) {
                if (!predicate(list[keys[i]], keys[i], list)) {
                    ret[keys[i]] = list[keys[i]];
                }
            }
        }
        return ret == undefined ? [] : ret;
    }

    _.contains = _.includes = _.include = function (list, value, fromIndex, guard) {
        var values, index;
        if(list == null) return false;
        if(typeof fromIndex !== 'number' || guard) fromIndex = 0;
        if(_.isArrayLike(list)) {
            fromIndex = fromIndex >= 0 ? Math.min(fromIndex, Math.max(list.length - 1, 0)) : Math.max(list.length + fromIndex, 0);
            // index = list.indexOf(value);
            index = _.indexOf(list, value, fromIndex);
            if(index >= fromIndex) return true;
        }
        if(_.isRealObject(list)) {
            values = _.values(list);
            fromIndex = fromIndex >= 0 ? Math.min(fromIndex, Math.max(values.length - 1, 0)) : Math.max(list.length + fromIndex, 0);
            // index = values.indexOf(value);
            index = _.indexOf(values, value, fromIndex);
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
        if (!_.isArrayLike(list)) return [];
        if (!_.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
        }
        if (iteratee != null) iteratee = cb(iteratee, context);
        
        var seen = [];
        var ret = [];

        for (var i = 0; i < list.length; i++) {
            var val = list[i];
            var computed = iteratee ? iteratee(val, i, list) : val;
            if (isSorted && !iteratee) {
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
        var deepMethod, context;
        if(!_.isArray(args)) {
            methodName = methodName[0];
        }
        _.each(list, function (val, index, list) {

            if(typeof methodName === 'function') {
                result[index] = methodName.apply(val, args);
            } else if(_.isArray(methodName)) {
                deepMethod = _.deepGet(methodName)(val);
                if(typeof deepMethod === 'function') {
                    // || val -> fix bug: methodName.length === 1, context point to window.
                    context = _.deepGet(methodName.slice(0,-1))(val) || val;
                    result[index] = deepMethod.apply(context, args);
                } else {
                    if(deepMethod == null)
                        return result.push(deepMethod);
                }
            } else {
                // other variable how to operation ?
                if(typeof val[methodName] === 'function') {
                    result[index] = val[methodName].apply(val, args);
                } else {
                    if(val[methodName] == null)
                        result[index] = val[methodName];
                }
                if(typeof val[methodName] !== 'function' && val[methodName] != null) {
                    throw new TypeError('non-functions');
                }
            }


        })

        return result;
    });

    _.pluck = function (list, propertyName) {
        var result = [];
        if(_.isArray(list)) {
            _.each(list, function(val, index, list) {
                if(_.isObject(val)) {
                    // call has?
                    if(propertyName in val) {
                        result.push(val[propertyName]);
                    } else {
                        result.push(undefined);
                    }
                }
            })
        }
        return result;
    }

    // how to assure execute iteratee and execute mapFn has non-iteratee...
    _.max = function(list, iteratee, context) {
        var maxVal = -Infinity, max, current;
        if(_.isEmpty(list)) return maxVal;
        if(!_.isUndefined(iteratee)) {
            // fix bug:_.map's iteratee
            if(context && context[iteratee] == list) {
                iteratee = cb();
            } else 
                iteratee = cb(iteratee, context);
        } else {
            iteratee = cb();
        }
        _.each(list, function(val, index, list) {
            current = iteratee(val, index, list);
            current = _.isString(current) ? Number(iteratee(val, index, list)) : current;
            if(max == null && ((!_.isNaN(current) && _.isNumber(current)) || _.isDate(current))) max = val;
            if(current > maxVal && ((!_.isNaN(current) && _.isNumber(current)) || _.isDate(current))) {
                maxVal = current;
                max = val;
            }
        })
        return max || maxVal;
    }

    _.min = function(list, iteratee, context) {

        var minVal = Infinity, min, current;
        if(_.isEmpty(list)) return minVal;
        if(!_.isUndefined(iteratee)) {
            // fix bug:_.map's iteratee
            if(context && context[iteratee] == list) {
                iteratee = cb();
            } else 
                iteratee = cb(iteratee, context);
        } else {
            iteratee = cb();
        }
        _.each(list, function(val, index, list) {
            current = iteratee(val, index, list);
            current = _.isString(current) ? Number(iteratee(val, index, list)) : current;
            if(min == null && ((!_.isNaN(current) && _.isNumber(current)) || _.isDate(current))) min = val;
            if(current < minVal && ((!_.isNaN(current) && _.isNumber(current)) || _.isDate(current))) {
                minVal = current;
                min = val;
            }
        })
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
        if(has(ret, String(key))) {
            ret[key].push(val);
        } else {
            ret[key] = [val];
        }
    })

    _.indexBy = group(function(key, ret, val) {
        ret[key] = val;
    });

    _.countBy = group(function(key, ret, val) {
        if(has(ret, String(key))) {
            ret[key]++
        } else {
            ret[key] = 1;
        }
    });

    _.sample = function(list, n, isOnlyOne) {
        if(n == null || isOnlyOne) {
            if(!_.isArrayLike(list) || _.isObject(list)) list = _.values(list);
            return list[_.random(list.length)];
        }
        if(!_.isArrayLike(list) || _.isObject(list)) list = _.values(list);
        else list = _.clone(list);
        var j, temp, length = _.isArray(list) ? list.length : _.values(list).length;
        if(length <= 1) return list;
        n = Math.max(Math.min(n, length), 0);
        for(var i = 0; i < length; i++) {
            // j = _.random(0, length - i);
            j = _.random(i, length - 1);
            temp = list[i];
            list[i] = list[j];
            list[j] = temp;
        }
        return slice.call(list, 0, n);
    }

    _.shuffle = function(list) {
        return _.sample(list, Infinity);
    }

    _.findKey = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = _.keys(obj);
        if(keys.length === 0) return;
        for(var i = 0; i < keys.length; i++) {
            if(predicate(obj[keys[i]], keys[i], obj)) {
                return keys[i];
            }
        }
    }

    // what's some symbols?
    var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;

    _.toArray = function(anything) {
        if(_.isObject(anything)) return _.values(anything);
        if(_.isArray(anything)) return _.clone(anything);
        if(_.isString(anything)) return anything.match(reStrSymbol) || [];
        if(_.isArrayLike(anything)) return slice.call(anything, 0);
        return [anything];
    }

    _.size = function(list) {
        if(_.isString(list)) return getLength(list) || 0;
        if(_.isObject(list) && !_.isArrayLike(list)) return _.values(list).length;
        if(_.isArrayLike(list)) return list.length;
        return 0;
    }

    _.partition = function(list, iteratee, context) {
        iteratee = cb(iteratee, context);
        var ret, keys;
        if(_.isRealObject(list)) {
            // ret = [{}, {}];
            ret = [[], []];
            keys = _.keys(list);
            _.each(keys, function(key, i, keys) {
                if(iteratee(list[key], key, list)) {
                    ret[0].push(list[key]);
                    // ret[0][key] = list[key];
                } else {
                    ret[1].push(list[key]);
                    // ret[1][key] = list[key];
                }
            })
            return ret;
        }
        if(_.isArrayLike(list)) {
            ret = [[], []];
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
        return _.partition(list, _.negate(Boolean))[1];
    }

    _.first = _.head = _.take = function(list, n, guard) {
        if(!_.isArrayLike(list) || list.length < 1) return !_.isNumber(n) ? void 0 : [];
        if(!_.isNumber(n) || guard) return list[0];
        return _.initial(list, list.length - n);
    }

    _.initial = function(list, n, guard) {
        if(!_.isArrayLike(list) || list.length < 1) return [];
        return slice.call(list, 0, Math.max(0, Math.min(list.length - (!_.isNumber(n) || guard ? 1 : n), list.length)));
    }

    _.last = function(list, n, guard) {
        if(!_.isArrayLike(list) || list.length < 1) return !_.isNumber(n) ? void 0 : [];
        if(!_.isNumber(n) || guard) return list[list.length - 1];
        return _.rest(list, list.length - n);
    }

    _.rest = _.drop = _.tail = function(list, n, guard) {
        if(!_.isArrayLike(list) || list.length < 1) return [];
        return slice.call(list, Math.max(!_.isNumber(n) || guard ? 1 : n, 0), list.length);
    }

    _.debounce = function(fn, delay, immediate) {
        var timer = null, isCallNow;
        immediate = immediate || false;
        var result;

        var debounce = function() {
            // cleartimeout in the first
            if(timer) clearTimeout(timer);
            var context = this;
            var args = arguments;
            if(false !== immediate) {
                isCallNow = !timer;
                timer = setTimeout(function() {
                    //result can't return...
                    // fix bug: can't callNow
                    timer = null;
                    // why the underscore not use under ?
                    // I'cant understand, but for pass the test:debounce asap-incr was debounced
                    // result = fn.apply(context, args);
                }, delay);

                if(isCallNow) {
                    result = fn.apply(context, args);
                }

            } else {

                timer = setTimeout(function() {
                    //result can't return...
                    // fix bug: can't callNow
                    timer = null;
                    result = fn.apply(context, args);
                }, delay);

            }

            return result;

        };

        debounce.reset = function (immediate) {
            immediate = immediate || false;
        };
        debounce.cancel = function () {
            clearTimeout(timer);
            timer = null;
        };

        return debounce;
    };

    _.throttle = function(fn, delay, options) {
        // previous = 0 cause fn run immediately;
        var timer, context, args, result, previous = 0;
        var options = options || {
            // others: off, false: on
            leading: true,
            // others: on, false: off
            trailing: true
        };
        // delay = delay;
        var throttle = function() {
            var now = _.now();
            // if (previous === undefined) previous = 0;
            //  = now cause fn can't run immediately;
            if (!previous && options.leading === false) previous = now;
            var remaining = delay - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > delay) {
                //if enter delay limits clearTimeout remove trailing effect;
                if(timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                previous = now;
                // fix bug:throttle-re-entrant, if re-call in the fn, must set the previous above the fn's invoke.
                result = fn.apply(context, args);
                if(!timer) context = args = null;

            } else if(!timer && options.trailing !== false) {
                // trailing effect caused by setTimeout
                timer = setTimeout(function() {

                    // fix bug:lost context and args,because in the throttle-re-rntrant
                    // fn's invoke,will get the newer timer, so if just timer = context = args = null
                    // it will cause a bug;
                    timer = null;

                    // fix bug: call immediate
                    // cause non-set-previous
                    previous = options.leading === false ? 0 : _.now();
                    result = fn.apply(context, args);
                    // fix bug:
                    if(!timer) {
                        context = args = null;
                    }
                }, remaining);
            }
            // fix bug: return undefined
            return result;
        };

        throttle.cancel = function() {
            // previous = now;
            clearTimeout(timer);
            previous = 0;
            timer = context = args = null;
        };

        throttle.reset = function (options) {
            previous = 0;
            options = options || {
                leading: true,
                trailing: true
            };
        };

        return throttle;
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
            }, wait);
        }
        loop.reset = function(resetCount) {
            if(!_.isNaN(Number(resetCount))) {
                count = Number(resetCount) || count;
            }
            chunk = Math.max(1, count);
        }
        return loop;
    };

    _.once = function(fn) {
        var result, count = 0;
        return function() {
            var context = this;
            var args = arguments;
            // fix bug:re-call fn cause stackoverflow
            count++
            if(fn && count <= 1) {
                result = fn.apply(context, args);
                fn = null;
            }
            return result;
        }
    };

    _.after = function(count, fn) {
        var initCount = 0, result;
        
        if (!_.isNumber(count)) return noop;
        count = count || 1;
        return function() {
            var context = this;
            var args = arguments;
            initCount++;
            if (initCount === count && fn) {
                result = fn.apply(context, args);
                fn = null;
            }
            return result;
        }
    };

    _.before = function(count, fn) {
        var initCount = 0, result;
        if (!_.isNumber(count)) return noop;
        count = count || 1;
        return function () {
            var context = this;
            var args = arguments;
            initCount++;
            if (initCount < count && fn) {
                result = fn.apply(context, args);
            } else {
                fn = null;
            }
            return result;
        }
    };

    _.wrap = function(fn, wrapper) {
        if(!_.isArgsFunction(fn, wrapper)) return noop;
        return restArguments(function(args) {
            args.unshift(fn);
            return wrapper.apply(this, args);
        })
    }

    //negate the type not the value ?
    //But undefined and null and NaN is not to negate
    //Number and NaN is not to negate
    _.negateArgsType = function(type) {
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

    _.negateType = function(type) {
        return function (target) {
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
        }
    };

    // how it work ?
    // !predicate.apply(this, arguments)
    _.negate = function(predicate) {
        return function () {
            return !predicate.apply(this, arguments);
        };
    };



    _.restArguments = restArguments;

    _.compose = _.restArguments(function (fns) {
        return _.restArguments(function (args) {
            var ret;
            var i = fns.length - 1
            
            i >= 0 && (ret = fns[i].apply(this, args));
            for (var i = fns.length - 2; i >= 0; i--) {

                ret = fns[i].call(this, ret);
            }
            return ret;
        })
    });

    _.noConflict = function () {
        // this operation will cover a variable _ as undefined
        root._ = defaultLikeUnderscoreUtil;
        return this;
    };

    _.constant = function (obj) {
        var closureVariable = obj;
        return function() {
            return closureVariable;
        }
    };

    _.times = function (n, iteratee, context) {
        var result = [];
        iteratee = cb(iteratee, context);
        for(var i = 0; i < n; i++) {
            result.push(iteratee(i));
        }
        return result;
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

    _.result = function(obj, property, defaultVal) {
        if(obj == null) return typeof defaultVal === 'function' ? defaultVal() : defaultVal;
        var result, i, length, context;

        if(_.isArrayLike(property)) {
            length = property.length;
            result = obj && obj[property[0]];
            context = (obj && obj[property[0]]);

            for(i = 1; i < length; i++) {
                if(typeof result === 'function') {
                    result = result() && result()[property[i]];
                } else {
                    result = result && result[property[i]]
                }

                if(i !== length - 1) {
                    
                    if(typeof context === 'function') {
                        // context = context() && context()[property[i]]
                        context = context.apply(obj) && context.apply(obj)[property[i]]
                    } else {
                        context = context && context[property[i]]
                    }
                }
            }
            context = typeof context === 'function' ? context.apply(obj) : context;
            // context = typeof context === 'function' ? context() : context;
        } else {
            result = obj && obj[property];
            context = obj;
        }

        if(result !== undefined) {
            return typeof result === 'function' ? result.call(context) : result;
        } else {
            // return typeof defaultVal === 'function' ? defaultVal.call(obj) : defaultVal;
            // return typeof defaultVal === 'function' ? defaultVal.call(context) : defaultVal;
            return typeof defaultVal === 'function' ? defaultVal.call(context || obj) : defaultVal;
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


    _.onceLog = restArguments(function(args) {
        if (logOnce) return;
        _.each(args, function(arg, i, args) {
            console.log('onceLog: 第' + (i + 1) + '个参数: ', arg);
        })
        logOnce = true;
        setTimeout(function() {
            logOnce = false;
        }, 0)
    });

    _.eqLog = function (eqArrs, logArrs, fnArrs) {
        if (eqArrs && Array.isArray(eqArrs) && (eqArrs.length === 0 || eqArrs.length % 2 === 1)) {
            throw new Error('eqLog function arguments must be an array and first one length must be double');
        }
        // how it not a original variable ?
        for (var i = 0; i < eqArrs.length; i += 2) {
            if (eqArrs[i] !== eqArrs[i + 1]) {
                return null;
            }
        }
        _.each(logArrs, function(arg, j, args) {
            console.log('eqLog: 第' + (j + 1) + '个参数: ', arg);
        })
        fnArrs && _.each(fnArrs, function(fn) {
            typeof fn === 'function' && fn();
        });
    };

    // to do: countLogFn
    _.countLog = function() {
        // var logCount = 0;
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

            get: function(target, property, receiver) {
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

            set: function(target, property, value, receiver) {
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
            revoke: function() {
                var me = this;
                _.each(_proxySet, function(fn) {
                    fn.apply(me);
                })
            }
        }
    }


    var buildTree = _.buildTree = function (list, fn, context, treeConfig) {
        treeConfig = treeConfig || {};
        var children = treeConfig.children;
        var parent = treeConfig.parent;
        var model = treeConfig.model;
        
        var temp = {};
        var tree = {};
        children = children || 'children';
        parent = parent || 'parent';
        if(!_.isObject(list) && !_.isArray(list)) return;
        fn = cb(fn,context);
        for (var j in list) {
            if (has(list, j))
                temp[list[j].name] = list[j];
        }
        for (var i in temp) {
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
            for (var k in tree) {
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

    _.beforeDetectEnv = function(env, isDetectFnsRelation) {
        env = env || root;
        
        if(isDetectFnsRelation) {
            Function.prototype.call = function (context) {
                var context = context || window;
                context.__fn = this;
                if (context != window) {
                    this.__children = this.__children || [];
                    toString.call(context.__proto__.constructor.name) !== ''
                        && this.__children.indexOf(toString.call(context.__proto__.constructor.name)) == -1
                        && toString.call(context.__proto__.constructor.name) != this.name
                        && this.__children.push(toString.call(context.__proto__.constructor.name));

                    context.__proto__.constructor.__parents = context.__proto__.constructor.__parents || [];
                    toString.call(this.name) !== '' && context.__proto__.constructor.__parents.indexOf(toString.call(this.name)) == -1
                        && context.__proto__.constructor.name != toString.call(this.name)
                        && context.__proto__.constructor.__parents.push(toString.call(this.name));
                    // console.log(context.__proto__.constructor.__parents.length > 1 ? context.__proto__.constructor.__parents : "");
                }
                var args = [];
                // i is 1
                for (var i = 1, len = arguments.length; i < len; i++) {
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
                    toString.call(context.__proto__.constructor.name) !== ''
                        && this.__children.indexOf( toString.call(context.__proto__.constructor.name)) == -1
                        &&  toString.call(context.__proto__.constructor.name) != this.name
                        && this.__children.push(toString.call(context.__proto__.constructor.name));

                    context.__proto__.constructor.__parents = context.__proto__.constructor.__parents || [];
                    toString.call(this.name) !== '' && context.__proto__.constructor.__parents.indexOf(toString.call(this.name)) != -1
                        && context.__proto__.constructor.name != toString.call(this.name)
                        && context.__proto__.constructor.__parents.push(toString.call(this.name));
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

        for (var _prop in env) {
            if (has(env, _prop) && originalPropArr.indexOf(_prop) === -1) originalPropArr.push(toString.call(_prop));
        }
    }

    _.detectEnv = function(env, isNotLongDetectFnsRelation) {
        env = env || root;
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
        var _typesForModel, toStringProp;
        originalPropArr.push('_typesForModel', 'model');

        for (var _prop in env) {
            toStringProp = toString.call(_prop);
            if (Object.prototype.hasOwnProperty.call(env, _prop)
                && originalPropArr.indexOf(toStringProp) === -1) {
                if (env[_prop] === null || env[_prop] === undefined) {
                    model['props']['nullAndUndefineds'].push(toStringProp);
                    continue;
                }
                _typesForModel = typeof env[_prop];
                // console.log(_typesForModel)
                switch (_typesForModel) {

                case 'function': {
                    model['classes'].push(toStringProp);
                    break;
                }
                case 'boolean': {
                    model['props']['bools'].push(toStringProp);
                    break;
                }
                case 'string': {
                    model['props']['strs'].push(toStringProp);
                    break;
                }
                case 'number': {
                    model['props']['nums'].push(toStringProp);
                    break;
                }
                case 'object': {
                    if (Array.isArray(env[_prop])) {
                        model['props']['arrs'].push(toStringProp);
                    } else {
                        model['props']['objs'].push(toStringProp);
                    }
                    break;
                }
                default: {
                    model['props']['vals'].push(toStringProp);
                    break;
                }

                }
            }
        }

        model.retClasses = _.map(model.classes, function(name){
            return {
                name: name,
                parent: env[name].__parents,
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

    _.each(_.functions(_), function(fnName, index, fns) {
        if(/^is/.test(fnName) && (fnName !== 'isEqual' || fnName !== 'isDeepEqual')) {
            _['isArgs' + fnName.slice(2)] = wrapperByArgsNumber(_[fnName], true);
        }
    })

    _.mixin(_);

    if(typeof define === 'function' && define.amd) {
        define('underscore', [], function() {
            return _;
        })
    };
}());