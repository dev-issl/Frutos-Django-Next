import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatMessage

User = get_user_model()

class LiveChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        # Only allow authenticated users
        if self.user.is_anonymous:
            await self.close()
            return
            
        # Join personal group for receiving messages
        self.room_group_name = f'chat_{self.user.id}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'send_message':
            receiver_id = data.get('receiver_id')
            text = data.get('text')
            
            if not receiver_id or not text:
                return

            # Save to database
            message = await self.save_message(self.user.id, receiver_id, text)
            
            payload = {
                'type': 'chat_message',
                'message_id': message.id,
                'sender_id': self.user.id,
                'receiver_id': receiver_id,
                'text': text,
                'created_at': message.created_at.isoformat(),
            }
            
            # Send to receiver
            await self.channel_layer.group_send(
                f'chat_{receiver_id}', payload
            )
            
            # Send back to sender
            await self.channel_layer.group_send(
                f'chat_{self.user.id}', payload
            )
            
        elif action == 'typing':
            receiver_id = data.get('receiver_id')
            is_typing = data.get('is_typing', True)
            if receiver_id:
                await self.channel_layer.group_send(
                    f'chat_{receiver_id}',
                    {
                        'type': 'typing_indicator',
                        'sender_id': self.user.id,
                        'is_typing': is_typing
                    }
                )
                
        elif action == 'mark_read':
            sender_id = data.get('sender_id')
            if sender_id:
                await self.mark_messages_read(sender_id, self.user.id)
                await self.channel_layer.group_send(
                    f'chat_{sender_id}',
                    {
                        'type': 'messages_read',
                        'reader_id': self.user.id
                    }
                )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'action': 'new_message',
            'message': {
                'id': event['message_id'],
                'sender_id': event['sender_id'],
                'receiver_id': event['receiver_id'],
                'text': event['text'],
                'created_at': event['created_at'],
            }
        }))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'action': 'typing',
            'sender_id': event['sender_id'],
            'is_typing': event['is_typing']
        }))

    async def messages_read(self, event):
        await self.send(text_data=json.dumps({
            'action': 'read_receipt',
            'reader_id': event['reader_id']
        }))

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, text):
        chat_msg = ChatMessage.objects.create(
            sender_id=sender_id,
            receiver_id=receiver_id,
            text=text
        )
        try:
            from staff.models import StaffAdminChat
            sender = User.objects.filter(id=sender_id).first()
            receiver = User.objects.filter(id=receiver_id).first()
            if sender and receiver:
                if hasattr(sender, 'staff_profile') and sender.staff_profile:
                    StaffAdminChat.objects.create(
                        staff=sender.staff_profile,
                        admin_user=receiver if getattr(receiver, 'user_type', None) == 'ADMIN' or receiver.is_superuser else None,
                        sender='STAFF',
                        message=text
                    )
                elif hasattr(receiver, 'staff_profile') and receiver.staff_profile:
                    StaffAdminChat.objects.create(
                        staff=receiver.staff_profile,
                        admin_user=sender if getattr(sender, 'user_type', None) == 'ADMIN' or sender.is_superuser else None,
                        sender='ADMIN',
                        message=text
                    )
        except Exception:
            pass
        return chat_msg

    @database_sync_to_async
    def mark_messages_read(self, sender_id, receiver_id):
        ChatMessage.objects.filter(
            sender_id=sender_id,
            receiver_id=receiver_id,
            is_read=False
        ).update(is_read=True)
