import type { Locale } from './meta'

type Dict = Record<string, string>

const en: Dict = {
  // Nav
  'nav.home': 'Home',
  'nav.actions': 'Actions',
  'nav.rewards': 'Rewards',
  'nav.more': 'More',

  // Common
  'cancel': 'Cancel',
  'undo': 'Undo',
  'save': 'Save',
  'edit': 'Edit',
  'remove': 'Remove',
  'add': '+ Add',

  // Home
  'home.family': 'Family',
  'home.switch': 'Switch',
  'home.no-kids': 'No kids yet',
  'home.no-kids-hint': 'Add your first child to get started.',
  'home.add-kid': 'Add a Kid',
  'home.add-stars': '⭐ Add Stars',
  'home.deduct-stars': '⚠️ Deduct Stars',
  'home.redeem': '🎁 Redeem',
  'home.today': 'Today',
  'home.yesterday': 'Yesterday',
  'home.no-activity': 'No activity yet',
  'home.no-activity-hint': 'Tap "Add Stars" above or log actions from the Actions tab.',
  'home.tx-deleted': 'Transaction deleted',
  'home.bonus-stars': 'Bonus stars',
  'home.deduction': 'Deduction',
  'home.reward-redeemed': 'Reward redeemed',

  // Quick action sheet
  'quick.award-stars': '⭐ Award Stars',
  'quick.deduct-stars': '⚠️ Deduct Stars',
  'quick.redeem-reward': '🎁 Redeem Reward',
  'quick.for-kid': 'For which kid?',
  'quick.select-action': 'Choose an action',
  'quick.custom': 'Custom amount',
  'quick.create-new': '+ New action',
  'quick.action-name': 'Action name',
  'quick.points': 'Stars',
  'quick.add-select': 'Add & Select',
  'quick.choose-reward': 'Choose a reward',
  'quick.stars-to-award': 'Stars to award',
  'quick.stars-to-deduct': 'Stars to deduct',
  'quick.reason': 'Reason (optional)',
  'quick.need-more': 'Need {n} more',
  'quick.select-kid-first': 'Select a kid first',
  'quick.no-actions': 'No actions yet. Create one below.',
  'quick.no-rewards': 'No rewards set up yet.',
  'quick.recent': 'Recent activity',
  'quick.no-history': 'No activity yet',
  'quick.confirm-redeem': 'Confirm Redeem',
  'quick.redeem-adjust': 'Adjust cost (optional)',
  'quick.balance': '{n} ⭐ balance',

  // Settings
  'settings.title': 'Settings',
  'settings.family': 'Family',
  'settings.language': 'Language',
  'settings.lang.en': 'English',
  'settings.lang.zh': '中文（简体）',
  'settings.categories': 'Categories',
  'settings.danger': 'Danger Zone',
  'settings.danger-description': 'This will permanently delete all family data including kids, actions, rewards, and history. This cannot be undone.',
  'settings.reset': 'Reset all data',
  'settings.reset-confirm': 'Are you absolutely sure?',
  'settings.reset-yes': 'Yes, delete everything',
  'settings.no-categories': 'No categories yet.',
  'settings.cat-placeholder': 'Category name',
}

const zh: Dict = {
  // Nav
  'nav.home': '主页',
  'nav.actions': '动作',
  'nav.rewards': '奖励',
  'nav.more': '更多',

  // Common
  'cancel': '取消',
  'undo': '撤销',
  'save': '保存',
  'edit': '编辑',
  'remove': '删除',
  'add': '+ 添加',

  // Home
  'home.family': '家庭',
  'home.switch': '切换',
  'home.no-kids': '还没有孩子',
  'home.no-kids-hint': '添加第一个孩子开始吧。',
  'home.add-kid': '添加孩子',
  'home.add-stars': '⭐ 加星星',
  'home.deduct-stars': '⚠️ 扣星星',
  'home.redeem': '🎁 兑换',
  'home.today': '今天',
  'home.yesterday': '昨天',
  'home.no-activity': '还没有活动',
  'home.no-activity-hint': '点击上方"加星星"，或在动作标签里记录。',
  'home.tx-deleted': '操作已删除',
  'home.bonus-stars': '额外星星',
  'home.deduction': '扣分',
  'home.reward-redeemed': '兑换奖励',

  // Quick action sheet
  'quick.award-stars': '⭐ 奖励星星',
  'quick.deduct-stars': '⚠️ 扣除星星',
  'quick.redeem-reward': '🎁 兑换奖励',
  'quick.for-kid': '为哪个孩子？',
  'quick.select-action': '选择一个动作',
  'quick.custom': '自定义数量',
  'quick.create-new': '+ 新建动作',
  'quick.action-name': '动作名称',
  'quick.points': '星星',
  'quick.add-select': '添加并选择',
  'quick.choose-reward': '选择奖励',
  'quick.stars-to-award': '要奖励的星星',
  'quick.stars-to-deduct': '要扣除的星星',
  'quick.reason': '原因（可选）',
  'quick.need-more': '还需 {n} 颗',
  'quick.select-kid-first': '请先选择孩子',
  'quick.no-actions': '还没有动作，在下方新建一个。',
  'quick.no-rewards': '还没有设置奖励。',
  'quick.recent': '近期记录',
  'quick.no-history': '还没有活动',
  'quick.confirm-redeem': '确认兑换',
  'quick.redeem-adjust': '调整费用（可选）',
  'quick.balance': '余额 {n} ⭐',

  // Settings
  'settings.title': '设置',
  'settings.family': '家庭',
  'settings.language': '语言',
  'settings.lang.en': 'English',
  'settings.lang.zh': '中文（简体）',
  'settings.categories': '分类',
  'settings.danger': '危险操作',
  'settings.danger-description': '这将永久删除所有家庭数据，包括孩子、动作、奖励和历史记录。此操作无法撤销。',
  'settings.reset': '重置所有数据',
  'settings.reset-confirm': '您确定要删除所有数据吗？',
  'settings.reset-yes': '是的，删除一切',
  'settings.no-categories': '还没有分类。',
  'settings.cat-placeholder': '分类名称',
}

const dict: Record<Locale, Dict> = { en, zh }

export function getT(locale: Locale) {
  return function t(key: string, params?: Record<string, string | number>): string {
    let str = dict[locale]?.[key] ?? dict.en[key] ?? key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }
}
