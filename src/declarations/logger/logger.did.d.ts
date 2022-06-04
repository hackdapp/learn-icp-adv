import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Error = { 'LoggerNotExist' : null } |
  { 'ViewRangeError' : null } |
  { 'MsgInputSizeErr' : null };
export interface MultiLogger {
  '_append' : ActorMethod<[Array<string>], Result_1>,
  '_getNewLogger' : ActorMethod<[], undefined>,
  '_view' : ActorMethod<[bigint, bigint], Result>,
  'append' : ActorMethod<[Array<string>], Result_1>,
  'view' : ActorMethod<[bigint, bigint], Result>,
  'wallet_receive' : ActorMethod<[], bigint>,
}
export type Result = { 'ok' : Array<string> } |
  { 'err' : Error };
export type Result_1 = { 'ok' : string } |
  { 'err' : Error };
export interface _SERVICE extends MultiLogger {}
