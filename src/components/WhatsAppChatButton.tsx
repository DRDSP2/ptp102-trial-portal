import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WhatsAppChatButtonProps = {
  phoneNumber?: string;
  message?: string;
  doctorName?: string;
  variant?: 'default' | 'floating';
};

export function WhatsAppChatButton({ 
  phoneNumber = '353833614859', 
  message = 'Hello, I need assistance with the PTP-102 Trial',
  doctorName = 'Dr. Daniel',
  variant = 'default'
}: WhatsAppChatButtonProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  
  if (variant === 'floating') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="font-medium">Chat with {doctorName}</span>
      </a>
    );
  }

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" className="gap-2 text-green-600 border-green-600 hover:bg-green-50">
        <MessageCircle className="h-5 w-5" />
        Chat with {doctorName}
      </Button>
    </a>
  );
}
