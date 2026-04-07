import decimal

# Set global decimal precision to handle large financial calculations and long-term projections
# without triggering InvalidOperation (which can happen at the default 28 precision
# when running balances accumulate over several years)
decimal.getcontext().prec = 50
