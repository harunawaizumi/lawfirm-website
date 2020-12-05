/*
 * form.js for Akibare Homepage
 * pxg
 */
(function($) {

  'use strict';

  $(function() {
    var $form = $('form[action$="form_records"]');

    // formがなければ何もしない
    if ( !$form.length ) {
      return;
    }

    $form.each(function() {
      var $form = $(this);
      var form = new FormCheck($form);
    });
  });

  /*
   * フォームのチェックユーティリティー
   *
   * @method FormCheck
   * @param {jQuery Object} $form
   */
  function FormCheck($form) {
    return this.init($form);
  }
  FormCheck.prototype = {

    /*
     * フォーム内要素のnameを置き換えるためのRegExp
     *
     * @RegExp
     */
    REPLACE_REG: (function() {
      return new RegExp(/form_record\[([^\]]+)\]/);
    }()),

    /*
     * 初期化処理
     *
     * @method init
     * @return {this} self
     */
    init: function($form) {
      var self = this;
      self.$form = $form;
      self.submitting = false;

      // プレビュー画面表示切り分け
      self.preview = false;
      if ( $form.attr('data-confirm-preview') === 'true' ) {
        self.preview = true;
      }

      self._getInputs();
      self._addConfirms();
      self._eventify();

      return self;
    },

    /*
     * イベント関連
     *
     * @method _eventify
     */
    _eventify: function() {
      var self = this;

      // submitを上書き
      self.$form
        // 確認画面へ
        .on('click', '.mod-form-submit-button input', function(ev) {
          // 送信中は操作不可
          if ( self.submitting === true ) {
            return false;
          }
          ev.preventDefault();
          self._submit(true);
        })
        // 編集へ戻る
        .on('click', '.mod-form-edit', function(ev) {
          ev.preventDefault();
          self._clearConfirm();
        })
        // 送信
        .on('submit', function(ev) {
          // 送信中は操作不可
          if ( self.submitting === true ) {
            return false;
          }
          self.submitting = true;
          ev.preventDefault();
          self._submit();
        });
    },

    /*
     * フォーム内のフォーム部品要素を取得する
     *
     * @method _getInputs
     */
    _getInputs: function() {
      var self = this;
      var $form = self.$form;
      var mapped = {};

      self.$inputs = $form.find([
        'input[type="text"]',
        'input[type="checkbox"]',
        'input[type="radio"]',
        'textarea',
        'select'
      ].join(',')).each(function() {
        var name = this.getAttribute('name').replace(/\[\]$/, '');
        var type = this.getAttribute('type');

        name = name.replace(self.REPLACE_REG, '$1');

        if ( type === 'checkbox' || type === 'radio' ) {
          if ( !/\[\]$/.test(this.name) ) {
            this.name = this.name + '[]';
          }
          return mapped[name] = {
            type: type,
            $input: $(this).parent().parent(),
            $inputs: $form.find('[name="' + this.name + '"]')
          };
        }

        mapped[name] = {
          type: 'default',
          $input: $(this)
        };
      });

      self.mapped = mapped;
    },

    /*
     * 確認画面モードに必要な要素を追加する
     *
     * @method _addConfirms
     */
    _addConfirms: function() {
      var self = this;
      var mapped = self.mapped;
      var $confirmBtnSet = self.$form.find('.mod-form-confirm-button');
      var $submitBtn = self.$form.find('.mod-form-submit-button');

      $.each(mapped, function(key, obj) {
        var $input = obj.$input;
        var $confirm = $('<span>').addClass('mod-formConfirm').hide();
        $input.after($confirm);
        mapped[key].$confirm = $confirm;
      });

      self.$confirmBtnSet = $confirmBtnSet;
      self.$submitBtn = $submitBtn;

      // プレビュー機能がオフのときは直接送信する
      if ( !self.preview ) {
        self.$confirmBtnSet.show();
        self.$submitBtn.hide();
        self.$confirmBtnSet.find('[type="button"]').hide();
      }

      self.mapped = mapped;
    },

    /*
     * submit時の挙動
     *
     * @method _submit
     * @param {Event} ev
     */
    _submit: function(preview) {
      var self = this;
      var $form = self.$form;
      var action = $form.attr('action');
      var url = action;

      if ( preview ) {
        url = url + '?preview=true'
      }

      $.ajax({
        type: 'POST',
        url: url,
        dataType: 'json',
        data: $form.serialize()
      })
      .always(function() {
        self.submitting = false;
      })
      .done(function(res) {
        if ( preview ) {
          self._showConfirm();
        } else {
          self._xhrSuccess(res);
        }
      }).fail(function(res, status, errorThrown) {
        if ( res.status === 500 ) {
          return alert('サーバーエラーが発生しました。');
        }
        self._xhrError(res);
      });
    },

    /*
     * 送信したデータで問題がなかった場合
     *
     * @method _xhrSuccess
     * @param {jqXHR} data
     */
    _xhrSuccess: function(data) {
      var self = this;
      
      self._clearErrors();

      // サンキューページにリダイレクト
      location.href = data.redirect_to || location.href;
    },

    /*
     * エラーが返された場合
     *
     * @method _xhrError
     * @param {jqXHR} data
     */
    _xhrError: function(data) {
      var self = this;
      var responseText = data.responseText;
      var parsed = $.parseJSON(responseText) || responseText;

      if ( typeof parsed !== 'object' || !('errors' in parsed) ) {
        self._showAlerts();
      } else {
        self._showErrors(parsed.errors);
      }
    },

    /*
     * 確認、編集モード切替時にフォームのトップへスクロールさせる
     *
     * @method _scrollToTop
     */
    _scrollToTop: function() {
      var self = this;
      var offset = self._getFormPosition();
      var $target = $('html,body');

      $target.animate({
        scrollTop: offset.top
      }, {
        easing: 'swing',
        duration: 250
      });
    },

    /*
     * フォームのオフセットを返す
     *
     * @method _getFormOffset
     * @return {Object} { top: a, left: b }
     */
    _getFormPosition: function() {
      var self = this;
      return self.$form.offset();
    },

    /*
     * フォームAPIでエラーが発生した場合
     *
     * @method _showAlerts
     */
    _showAlerts: function() {
      alert('サーバー通信エラーが発生しました。時間を置いてお試しください。');
    },

    /*
     * 疑似確認画面を表示
     *
     * @method _showConfirm
     * @param {Object} data
     */
    _showConfirm: function() {
      var self = this;
      var mapped = self.mapped;

      // エラーが表示されていたらremoveする
      self._clearErrors();

      $.each(mapped, function(key, obj) {
        var $input = obj.$inputs ? obj.$inputs : obj.$input;
        var $confirm = obj.$confirm;
        var type = obj.type;
        var value;

        if ( type === 'checkbox' || type === 'radio' ) {
          value = '';
          $input.each(function(i, input) {
            if ( !input.checked ) {
              return;
            }
            value = value + ', ' + input.value;
          });
          value = value.replace(/^, /, '');
        } else {
          value = $input.val();
        }

        // 改行コードを<br>に置き換え
        value = value.replace(/(?:\n\r?)|(?:\r\n?)/g, '<br>');

        $confirm.html(value).show();

        // 非表示はグループ
        if ( obj.$inputs ) {
          $input = obj.$input;
        }
        $input.hide();
      });

      // ボタンセットの切り替え
      self.$confirmBtnSet.show();
      self.$submitBtn.hide();

      // スクロール
      self._scrollToTop();
    },

    /*
     * 確認画面から編集画面に戻す
     *
     * @method _clearConfirm
     */
    _clearConfirm: function() {
      var self = this;
      var mapped = self.mapped;

      $.each(mapped, function(key, obj) {
        var $input = obj.$input;
        var $confirm = obj.$confirm;

        $confirm.hide();
        $input.show();
      });

      // ボタンセットの切り替え
      // 確認画面あり
      if ( self.preview ) {
        self.$confirmBtnSet.hide();
        self.$submitBtn.show();
      }

      // スクロール
      self._scrollToTop();
    },

    /*
     * 正しいエラーが返ってきた場合
     *
     * @method _showErrors
     * @param {Object} errors
     */
    _showErrors: function(errorsArray) {
      var self = this;
      var mapped = self.mapped;
      var errors = [];

      // 確認画面モードから戻す
      self._clearConfirm();
      // 先に今表示されているエラーをremoveする
      self._clearErrors();

      $.each(errorsArray, function(key, value) {
        var $elem = mapped[key].$input;
        var $error = $('<span>').addClass('mod-formError').text(value);

        $elem.addClass('mod-formError-notice');
        $elem.after($error);

        mapped[key].$error = $error;
        errors.push(mapped[key]);
      });

      self.errors = errors;
    },

    /*
     * 表示されているエラーをremoveする
     *
     * @method _clearErrors
     */
    _clearErrors: function() {
      var self = this;
      var errors = self.errors || [];
      $.each(errors, function(i, error) {
        error.$input.removeClass('mod-formError-notice');
        error.$error.remove();
      });
      self.errors = [];
    }
  };

}(jQuery));