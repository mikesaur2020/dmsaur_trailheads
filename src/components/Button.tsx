import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from './button-styles'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

/** A real button element with shared styling. */
export function Button({
  variant,
  size,
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  )
}

/** A router link styled as a button. */
export function ButtonLink({
  variant,
  size,
  className,
  children,
  ...rest
}: CommonProps & Omit<LinkProps, 'className'> & { className?: string }) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  )
}
