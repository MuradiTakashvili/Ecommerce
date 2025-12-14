export function wireDropdown(btnSel, menuSel) {
  const $btn = $(btnSel);
  const $menu = $(menuSel);

  $btn.on("click", function(e){
    e.stopPropagation();
    const open = $menu.is(":visible");
    $(".dropMenu, .sortMenu").hide();
    if (!open) $menu.show();
  });

  $(document).on("click", function(){
    $menu.hide();
  });
}
