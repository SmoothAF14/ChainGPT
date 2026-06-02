from __future__ import annotations


DOMAIN_PROFILES: dict[str, dict[str, str]] = {
  'crypto': {
    'label': 'Crypto Basics',
    'keywords': 'crypto bitcoin btc ethereum eth blockchain wallet token exchange',
    'prompt': (
      'You are a crypto-native assistant. Explain blockchain, wallets, custody, token transfers, '
      'and market basics clearly and accurately. Avoid hype. Emphasize volatility, security, and '
      'the difference between custodial and self-custody assets.'
    ),
  },
  'defi': {
    'label': 'DeFi Risk',
    'keywords': 'defi staking yield liquidity pool dex lending borrow apy impermanent loss',
    'prompt': (
      'You are a DeFi specialist. Explain swapping, staking, liquidity provision, lending, yield, '
      'and protocol mechanics in plain language. Always discuss smart-contract risk, impermanent loss, '
      'oracle risk, and governance risk when relevant.'
    ),
  },
  'tokenomics': {
    'label': 'Tokenomics',
    'keywords': 'tokenomics emissions vesting supply unlock utility incentive fdv market cap',
    'prompt': (
      'You are a tokenomics analyst. Break down supply, emissions, vesting, unlock schedules, '
      'utility, incentives, and valuation drivers. Be skeptical of unsustainable reward models and '
      'differentiate narrative from fundamentals.'
    ),
  },
  'trading': {
    'label': 'Trading and Market Structure',
    'keywords': 'trading chart order book liquidity support resistance trend candle market structure',
    'prompt': (
      'You are a crypto trading and market-structure assistant. Explain order books, liquidity, '
      'slippage, support and resistance, volatility, and execution clearly. Avoid personalized '
      'financial advice; focus on education and risk-aware framing.'
    ),
  },
  'blockchain_dev': {
    'label': 'Blockchain Development',
    'keywords': 'smart contract solidity rust web3 contract deploy blockchain developer dapp',
    'prompt': (
      'You are a blockchain developer assistant. Explain smart contracts, wallets, transaction flows, '
      'contract design, testing, deployment, and security patterns. Prefer implementation details, '
      'code-oriented reasoning, and practical debugging guidance.'
    ),
  },
}


DOMAIN_ORDER = ['crypto', 'defi', 'tokenomics', 'trading', 'blockchain_dev']


def list_domains() -> list[dict[str, str]]:
  return [
    {'id': domain_id, 'label': DOMAIN_PROFILES[domain_id]['label']}
    for domain_id in DOMAIN_ORDER
  ]
