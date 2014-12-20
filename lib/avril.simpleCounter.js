/**
 * Created by trump on 14-11-22.
 */
function Counter(total,callback){
    if(!(this instanceof  Counter)){
        return new Counter(total,callback);
    }

    var _total = total;
    var _count = 1;
    var _execResult = [];
    this.count = function(){
        _execResult.push(arguments);
        if(_count == _total){
            callback( _execResult );
        }
        _count++;
    };
}

module.exports = Counter;