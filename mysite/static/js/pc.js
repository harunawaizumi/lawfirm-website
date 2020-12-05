
//mod-navi-headerのリンク領域に行数に応じて適切なpaddingを付与するコード
$(document).ready(function(){
  var max = $(".mod-set-navi-header .mod-navi-inner ul").height();

  //ナビゲーションの配列でループ
  $(".mod-set-navi-header span.mod-gnav-item a").each(function(){
    var padding = (max - $(this).height())/2;
    $(this).css({'padding-top': padding});
    $(this).css({'padding-bottom': padding});
  });

  //暫定対応（旧方式部品削除後、以下削除する
  if($('.mod-gnav')[0]) {
    var gnav_max = $(".mod-gnav .mod-gnav-inner ul").height();
    //ナビゲーションの配列でループ
    $(".mod-gnav span.mod-gnav-item a").each(function(){
      var padding = (gnav_max - $(this).height())/2;
      $(this).css({'padding-top': padding});
      $(this).css({'padding-bottom': padding});
    });
  }
  if($('.mod-gnav2')[0]) {
    var gnav_max = $(".mod-gnav2 .mod-gnav-inner ul").height();
    //ナビゲーションの配列でループ
    $(".mod-gnav2 span.mod-gnav-item a").each(function(){
      var padding = (gnav_max - $(this).height())/2;
      $(this).css({'padding-top': padding});
      $(this).css({'padding-bottom': padding});
    });
  }
  // 暫定対応ここまで

  //トップページのみパンくず部品削除
  var url_arr = location.href.split('/');
  //公開ページ用
  if(url_arr[3] === '' || url_arr[3] === 'index.html') {
    if($('.mod-part-topicpath-header')[0]) $('.mod-part-topicpath-header').remove();
    if($('.mod-part-topicpath')[0]) $('.mod-part-topicpath').remove();
  }
  //CMS プレビュー用
  if((url_arr[2] === 'www.next-cms-dev.com' ||
      url_arr[2] === 'stg.next.blogdehp.jp' ||
      url_arr[2] === 'www.wms-sample.com' ||
      url_arr[2] === 'www.akibare-hp.com') && url_arr[3] === 'cms') {
    if($('.mod-part-topicpath-header')[0]) removePartTopicpathForCMS('-header');
    if($('.mod-part-topicpath')[0]) removePartTopicpathForCMS();
  }
});

function removePartTopicpathForCMS(suffix) {
  suffix = suffix || '';
  var remove_flg = true
  var part_elm = $('.mod-part-topicpath' + suffix);
  part_elm.each(function() {
    i = $(this).find('[itemscope]').length;
    if(i > 1) remove_flg = false
  });
  if(remove_flg) part_elm.remove();
}
