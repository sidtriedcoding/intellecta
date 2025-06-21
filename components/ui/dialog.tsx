"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}

interface DialogTriggerProps {
    asChild?: boolean
    children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }

const DialogContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
}>({
    open: false,
    setOpen: () => { },
})

const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
    const [internalOpen, setInternalOpen] = React.useState(open)
    const isControlled = onOpenChange !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen

    React.useEffect(() => {
        if (isControlled) {
            setInternalOpen(open)
        }
    }, [open, isControlled])

    return (
        <DialogContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
            {children}
        </DialogContext.Provider>
    )
}

const DialogTrigger: React.FC<DialogTriggerProps> = ({ asChild, children }) => {
    const { setOpen } = React.useContext(DialogContext)

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: () => setOpen(true),
        })
    }

    return (
        <button onClick={() => setOpen(true)}>
            {children}
        </button>
    )
}

const DialogContent: React.FC<DialogContentProps> = ({ className, children, ...props }) => {
    const { open, setOpen } = React.useContext(DialogContext)

    if (!open) return null

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setOpen(false)}
            />
            <div
                className={cn(
                    "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-white p-6 shadow-lg",
                    className
                )}
                {...props}
            >
                <button
                    onClick={() => setOpen(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                >
                    <X className="h-4 w-4" />
                </button>
                {children}
            </div>
        </>
    )
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, ...props }) => (
    <div
        className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
        {...props}
    />
)

const DialogTitle: React.FC<DialogTitleProps> = ({ className, ...props }) => (
    <h2
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
)

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
} 