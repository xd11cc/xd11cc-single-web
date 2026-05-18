import request from '@@/utils/request'
import type { ResponseVO } from 'types/api'
import type {
  UserLoginInfoVO,
  RouteVO,
  CaptchaVO,
  PhoneSmsLoginForm,
  QrCodeVO,
  RegisterForm,
  ResetPasswordForm,
  BindUserForm,
} from './type'
import { type QrCodeStatus } from './type'

export function loginByPassword<T>(data: T): Promise<ResponseVO<string>> {
  return request({
    url: '/login/loginByPassword',
    method: 'POST',
    data: data,
  })
}

export function logout(): Promise<ResponseVO<string>> {
  return request({
    url: '/logout',
    method: 'GET',
  })
}

export function getUserInfo(): Promise<ResponseVO<UserLoginInfoVO>> {
  return request({
    url: '/login/getUserInfo',
    method: 'GET',
  })
}

export function getRoutes(): Promise<ResponseVO<RouteVO[]>> {
  return request({
    url: '/login/getRoutes',
    method: 'GET',
  })
}

export function getCaptcha(): Promise<ResponseVO<CaptchaVO>> {
  return request({
    url: '/login/getCaptcha',
    method: 'GET',
  })
}

export function socialLogin(source: string): Promise<ResponseVO<string>> {
  return request({
    url: `/login/authorize/${source}`,
    method: 'GET',
    timeout: 30000,
  })
}

export function sendSmsCode(phone: string): Promise<ResponseVO<null>> {
  return request({
    url: '/login/sendSmsCode',
    method: 'POST',
    data: { phone },
  })
}

export function loginByPhone(data: PhoneSmsLoginForm): Promise<ResponseVO<string>> {
  return request({
    url: '/login/loginByPhone',
    method: 'POST',
    data,
  })
}

export function getQrCode(): Promise<ResponseVO<QrCodeVO>> {
  return request({
    url: '/login/qrCode/generate',
    method: 'GET',
  })
}

export function getQrCodeStatus(
  qrCodeId: string,
): Promise<ResponseVO<{ status: QrCodeStatus; token?: string }>> {
  return request({
    url: '/login/qrCode/status',
    method: 'GET',
    params: { qrCodeId },
  })
}

export function register(data: RegisterForm): Promise<ResponseVO<null>> {
  return request({
    url: '/login/register',
    method: 'POST',
    data,
  })
}

export function resetPassword(data: ResetPasswordForm): Promise<ResponseVO<null>> {
  return request({
    url: '/login/resetPassword',
    method: 'POST',
    data,
  })
}

export function sendEmailCode(email: string): Promise<ResponseVO<null>> {
  return request({
    url: '/login/sendEmailCode',
    method: 'POST',
    data: { email },
  })
}

export function bindUser(data: BindUserForm): Promise<ResponseVO<string>> {
  return request({
    url: '/login/bindUser',
    method: 'POST',
    data,
  })
}
