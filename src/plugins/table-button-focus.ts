/**
 * 鼠标或触摸点击表格操作按钮后主动释放焦点。
 *
 * Element Plus Dialog 关闭时会恢复打开弹窗前的焦点。如果触发元素仍是
 * 表格按钮，按钮会再次呈现 focus-visible 状态，看起来像一直被选中。
 * 这里只处理 pointer 操作，键盘 Tab/Enter 触发时仍保留正常的焦点反馈。
 */
export function installTableButtonFocusHandler() {
  document.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (!(event.target instanceof Element)) return

    const button = event.target.closest<HTMLElement>('.el-table .el-button')
    button?.blur()
  })
}
