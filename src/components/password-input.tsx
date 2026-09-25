import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <span className="relative block">
        <input
          {...props}
          ref={ref}
          className={`${className ?? ''} pr-12`}
          type={visible ? 'text' : 'password'}
        />
        <button
          className="absolute right-0 top-1/2 min-h-9 min-w-10 -translate-y-1/2 cursor-pointer border-0 bg-transparent text-xs text-zinc-500 hover:text-zinc-950"
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          <span aria-hidden="true">{visible ? <EyeOff /> : <Eye /> }</span>
        </button>
      </span>
    );
  }
);
