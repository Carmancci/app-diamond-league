'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTitle = DialogPrimitive.Title
const DialogDescription = DialogPrimitive.Description

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Popup>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 bg-foreground/55 backdrop-blur-sm transition-opacity" />
      <DialogPrimitive.Viewport className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6">
        <DialogPrimitive.Popup className={cn('relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-background p-5 text-foreground shadow-2xl outline-none sm:max-w-2xl sm:rounded-2xl sm:p-6', className)} {...props}>
          {children}
          <DialogPrimitive.Close aria-label="Fechar perfil" className="absolute right-4 top-4 rounded-full border border-border bg-background p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  )
}

export { Dialog, DialogContent, DialogTitle, DialogDescription }
