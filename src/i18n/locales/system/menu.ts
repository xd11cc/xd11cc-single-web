export const zh = {
  actions: {
    add: "新增菜单",
    addChild: "新增",
    collapseAll: "收起全部",
    delete: "删除菜单",
    edit: "修改菜单",
    expandAll: "展开全部",
    query: "查询"
  },
  columns: {
    action: "操作",
    component: "组件路径",
    createTime: "创建时间",
    icon: "图标",
    menuName: "菜单名称",
    orderNum: "排序",
    path: "路由地址",
    perms: "权限字符",
    status: "状态",
    type: "类型"
  },
  dialogs: {
    add: "新增菜单",
    edit: "修改菜单"
  },
  form: {
    component: "组件路径",
    icon: "菜单图标",
    isCache: "是否缓存",
    isVisible: "显示状态",
    menuName: "菜单名称",
    menuType: "菜单类型",
    orderNum: "显示排序",
    parentMenu: "上级菜单",
    path: "路由地址",
    perms: "权限标识",
    query: "路由参数",
    routeName: "路由名称",
    status: "菜单状态"
  },
  formPlaceholder: {
    component: "请输入组件路径",
    menuName: "请输入菜单名称",
    orderNum: "请输入显示排序",
    parentId: "请选择上级菜单",
    path: "请输入路由地址",
    permission: "请输入权限字符",
    query: "请输入路由参数",
    routeName: "请输入路由名称",
    status: "菜单状态"
  },
  messages: {
    deleteConfirm: "正在删除{menuName}菜单数据，确认删除？",
    formError: "表单校验不通过",
    operationSuccess: "操作成功"
  },
  search: {
    menuName: "菜单名称",
    status: "状态",
    statusPlaceholder: "请选择"
  },
  title: "菜单管理",
  tooltip: {
    component: "访问的组件路径，如：`system/user/index`，默认在`views`目录下",
    path: "访问的路由地址，如：`user`，如外网地址需内链访问则以`http(s)://`开头",
    perms: "控制器中定义的权限字符，如：@PreAuthorize(`@ss.hasPermi('system:user:list')`)",
    query: "访问路由的默认传递参数，如：`{\"id\": 1, \"name\": \"ry\"}`"
  },
  types: {
    button: "按钮",
    dir: "目录",
    menu: "菜单"
  }
}
export const en = {
  actions: {
    add: "Add Menu",
    addChild: "Add",
    collapseAll: "Collapse All",
    delete: "Delete Menu",
    edit: "Edit Menu",
    expandAll: "Expand All",
    query: "Search"
  },
  columns: {
    action: "Action",
    component: "Component Path",
    createTime: "Created",
    icon: "Icon",
    menuName: "Menu Name",
    orderNum: "Sort",
    path: "Route Path",
    perms: "Permission",
    status: "Status",
    type: "Type"
  },
  dialogs: {
    add: "Add Menu",
    edit: "Edit Menu"
  },
  form: {
    component: "Component Path",
    icon: "Menu Icon",
    isCache: "Cache",
    isVisible: "Visible",
    menuName: "Menu Name",
    menuType: "Menu Type",
    orderNum: "Display Sort",
    parentMenu: "Parent Menu",
    path: "Route Path",
    perms: "Permission",
    query: "Route Params",
    routeName: "Route Name",
    status: "Menu Status"
  },
  formPlaceholder: {
    component: "Please enter component path",
    menuName: "Please enter menu name",
    orderNum: "Please enter display sort",
    parentId: "Please select parent menu",
    path: "Please enter route path",
    permission: "Please enter permission",
    query: "Please enter route params",
    routeName: "Please enter route name",
    status: "Menu status"
  },
  messages: {
    deleteConfirm: "Delete menu {menuName}, confirm?",
    formError: "Form validation failed",
    operationSuccess: "Operation successful"
  },
  search: {
    menuName: "Menu Name",
    status: "Status",
    statusPlaceholder: "Please select"
  },
  title: "Menu Management",
  tooltip: {
    component: "Component path, e.g. `system/user/index`, defaults to `views` directory",
    path: "Route address, e.g. `user`, use `http(s)://` prefix for external links",
    perms: "Permission string defined in controller, e.g. @PreAuthorize(`@ss.hasPermi('system:user:list')`)",
    query: "Default route params, e.g. `{\"id\": 1, \"name\": \"ry\"}`"
  },
  types: {
    button: "Button",
    dir: "Directory",
    menu: "Menu"
  }
}
