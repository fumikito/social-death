/**
 * 社交的な作家とそうでない作家が生き残る様を描く
 *
 * @author fumikito <guy@hametuha.com>
 */

/*global Backbone: true*/

(function ($) {

    'use strict';

    $(document).ready(function(){

        /**
         * 著者を表すモデル
         *
         * @type {Backbone.Model}
         */
        var Author = Backbone.Model.extend({
            defaults: {
                id: 0,
                res      : 0.5,      // 他人に対する反応
                gift     : 0.5,      // 才能
                power    : 1,        // 実力
                initial  : 1         // 最初の実力
            }
        });

        /**
         * 著者のコレクション
         *
         * @type {Backbone.Collection}
         */
        var Authors = Backbone.Collection.extend({
            models: Author,
            comparator: function(author){
                return parseInt(author.get('id'), 10);
            }
        });

        /**
         * 著者を表示するビュー
         *
         * @type {Backbone.View}
         */
        var Circle = Backbone.View.extend({

            tagName: 'div',

            events: {},

            /**
             * サイズの係数
             */
            sizeUnit: 1,

            /**
             * コンストラクタ
             */
            initialize: function(){
                _.bindAll(this, 'render', 'clear');
                // 変更があった場合はDOMを更新する
                this.model.bind('change', this.render);
                this.model.bind('remove', this.clear);
            },

            /**
             * 描画する
             */
            render: function(){
                var size = Math.max(10, this.model.get('power') * this.sizeUnit);
                this.$el
                    .removeClass('banal').removeClass('gifted').removeClass('critic')
                    .css({
                        width:  size + 'px',
                        height: size + 'px',
                        lineHeight: size + 'px',
                        left: Math.floor(Math.random() * 100) + '%',
                        top: Math.floor(Math.random() * 100) + '%',
                    })
                    .attr('title',
                        '返答率' + Math.floor( this.model.get('res') * 100) + '%, '
                        + '才能' + Math.floor( this.model.get('gift') * 100) + '%'
                        + '財産' +  Math.floor( this.model.get('power') )
                        +  '(' + Math.floor( this.model.get('initial') ) + ')'
                    );
                //    .text(Math.floor( this.model.get('gift') * 100 ) + ':' + Math.floor( this.model.get('res') * 100 ))
                if( this.model.get('gift') > .8 ){
                    this.$el.addClass('gifted');
                }else if( this.model.get('res') > .8 ){
                    this.$el.addClass('critic');
                }else{
                    this.$el.addClass('banal');
                }

                return this;
            },

            /**
             * モデル削除に応じて画面から消す
             */
            clear: function(){
                this.$el.remove();
            },

            /**
             * 外部からモデルごと消す
             */
            remove: function(){
                this.model.destroy();
            }

        });


        /**
         * 世代管理
         *
         * @type {Backbone.View}
         */
        var Generation = Backbone.View.extend({

            /**
             * @type {Backbone.Collection}
             */
            collection: null,

            el: '#main-container',

            timer: null,

            /**
             * 世代のリミット
             */
            limit: 9,

            /**
             * 年
             */
            year: 0,

            /**
             * 国民のID
             */
            idCounter: 0,

            /**
             * 初期値の人口
             */
            population: 100,

            events: {
                "start.generation": 'startGeneration',
                "update.generation": "updateGeneration",
                "change.generation": "changeGeneration"
            },

            /**
             * コンストラクタ
             */
            initialize: function() {
                // バインド
                _.bindAll(this, 'appendItem', 'resetItems', 'countTime', 'startGeneration', 'updateGeneration', 'changeGeneration', 'resumeGeneration', 'makeChild');
                // コレクションを初期化
                this.collection = new Authors();
                // モデルが追加されたとき
                this.collection.bind('add', this.appendItem);
                this.collection.bind('reset', this.resetItems);
                // タイマー起動
                this.resumeGeneration();
                $('.btn-resume').on('click', this.resumeGeneration);
            },

            /**
             * モデルが追加された
             *
             * @param {Backbone.Model} author
             */
            appendItem: function(author){
                var circle = new Circle({
                    model: author
                });
                this.$el.append(circle.render().$el);
            },

            /**
             * モデルがすべてリセットされた
             *
             * @param collection
             * @param options
             */
            resetItems: function(collection, options){
                var self = this;
                _.each(options.previousModels, function(author){
                    author.trigger('remove');
                });
                _.each(collection.models, function(author){
                    self.appendItem(author);
                });
            },

            /**
             * 世代を監視する
             */
            countTime: function(){
                this.year++;
                if( 1 === this.year ){
                    // 1年目。最初の住人を追加
                    this.$el.trigger('start.generation');
                }else{
                    // 単なる交流
                    this.$el.trigger('update.generation');
                    // 20年目。世代交代
                    if( this.year % 20 == 0 ){
                        this.$el.trigger('change.generation');
                    }
                }
            },

            /**
             * 指定された人数だけ作家を作成
             */
            startGeneration: function(){
                for( var i = 0; i < this.population; i++ ){
                    var author = new Author(),
                        giftRatio = Math.random(),
                        resRatio = Math.random(),
                        gift, power;
                    // 才能と反応率は反比例する
                    if( giftRatio < 0.02 ){
                        // 50人に1人は才能いかんに関わらず
                        // ランダムな才能を持つ
                        // あるものは才能があり、他人にも反応する
                        // またあるものは才能がなく、他人にも反応しない
                        gift = resRatio;
                    }else{
                        // 普通の人は反比例
                        gift = 1 - resRatio;
                    }
                    power = 10 * Math.random();
                    author.set({
                        id: this.idCounter,
                        res      : resRatio,
                        gift     : gift,
                        power    : power,
                        initial  : power
                    });
                    this.idCounter++;
                    this.collection.add(author);
                }
            },

            /**
             * 1年が経った
             */
            updateGeneration: function(){
                var models = this.collection.models;
                _.each(models, function(author){
                    var point = 0,
                        result;
                    _.each(models, function(target){
                        // 自分は自分に評価しない
                        if( author.get('id') === target.get('id') ){
                            return;
                        }
                        // 反応しやすい人ほど反応をもらえる
                        if( Math.random() > author.get('res') ){
                            return;
                        }
                        // 反応した人は批判あるいは賞賛する
                        // 1/3の確率で批判
                        // 評価の強度は著者の才能に比例する
                        var isCritical = Math.random() > .666,
                            sign       = isCritical ? -1 : 1;
                        point += (sign * author.get('gift')) / 10;
                    });
                    result = author.get('power') + point;
                    author.set('power', result);

                });
                $('span', '#message').text(this.year + '年 / ' + this.collection.length + '人');
            },

            /**
             * 世代交代
             */
            changeGeneration: function(){
                // 次世代
                var nextGen = [],
                    collection = this.collection;
                // リミットをすぎたら終わり
                if( this.year / 20 > this.limit){
                    clearInterval(this.timer);
                }
                // 交配させる
                // 淘汰が働くため、下の方は切り捨てられる
                for( var i = 0, l = collection.models.length / 2; i < l; i++){
                    var cbr     = 3, // 出生率は常に3
                        husband = this.collection.at(i),
                        wife    = this.collection.at(i + 1);
                    for( var j = 0; j < cbr; j++ ){
                        nextGen.push(this.makeChild(husband, wife));
                    }
                }
                // 子供たちを成績順に並び替え
                nextGen.sort(function(a, b){
                    return a.get('power') > b.get('power');
                });
                // 成績の悪い下位30%は死ぬ
                var survived = [];
                for( i = 0, l = nextGen.length; i < l; i++ ){
                    survived.push(nextGen[i]);
                    if( i / l > 0.7 ){
                        break;
                    }
                }
                // シャッフル
                survived.sort(function() {
                    return Math.random() - 0.5;
                });
                // 親を全部殺し、
                // 新しい世代を追加
                collection.reset(survived);
                clearInterval(this.timer);
            },

            /**
             * 子供を作る
             *
             * @param {Backbone.Model} father
             * @param {Backbone.Model} mather
             * @return {Backbone.Model}
             */
            makeChild: function(father, mather){
                var parents = [father, mather],
                    child   = new Author(),
                    power = (father.get('power') + mather.get('power')) / 2, // 最初の実力は父母の平均
                    params  = {
                        id: this.idCounter,
                        power: power,
                        initial: power
                    };
                // 才能
                switch( Math.ceil(Math.random() * 3 ) ){
                    case 3:
                        // 誇り高き人間は才能を受け継ぐ
                        params.gift = Math.max(father.get('gift'), mather.get('gift'));
                        break;
                    case 2:
                        // そうでなければ平均
                        params.gift = ( father.get('gift') + mather.get('gift') ) / 2;
                        break;
                    default:
                        // 才能のない親に似る
                        params.gift = Math.min(father.get('gift'), mather.get('gift'));
                        break;
                        break;
                }
                // 返答
                if( Math.random() < 0.02 ){
                    // 50人に1人は関係なし
                    params.res = Math.random();
                }else{
                    // 普通は反比例
                    params.res = 1 - params.gift;
                }
                child.set(params);
                this.idCounter++;
                // 産まれた！
                return child;
            },

            /**
             * 時計を動かす
             *
             * @param {Event} e
             */
            resumeGeneration: function(e){
                if( e ){
                    e.preventDefault();
                }
                this.timer = setInterval(this.countTime, 100);
            }
        });


        new Generation();

    });

})(jQuery);
