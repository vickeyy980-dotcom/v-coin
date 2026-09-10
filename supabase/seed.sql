-- Run after schema.sql
insert into public.permissions(code,label) values
('CREATE_USER','Create users'),('VIEW_USERS','View users'),('EDIT_USER','Edit users'),
('DEACTIVATE_USER','Deactivate users'),('VCOIN_REQUESTS','V Coin requests'),
('CRYPTO_REQUESTS','Crypto requests'),('BANK_TRANSFER_REQUESTS','Bank transfer requests'),
('APPROVE_REQUESTS','Approve requests'),('VIEW_COMMISSION','View commission'),
('VIEW_TRANSACTIONS','View transactions'),('VIEW_REPORTS','View reports')
on conflict (code) do update set label=excluded.label;

insert into public.crypto_assets(symbol,name,network,vcoin_per_unit,network_fee_vcoin,is_active)
values ('USDT','Tether','TRON',100,1,true)
on conflict(symbol) do update set name=excluded.name,network=excluded.network,vcoin_per_unit=excluded.vcoin_per_unit,network_fee_vcoin=excluded.network_fee_vcoin,is_active=true;

insert into public.system_settings(key,value) values ('BANK_VCOIN_RATE','{"rate":1}'::jsonb)
on conflict(key) do update set value=excluded.value,updated_at=now();
