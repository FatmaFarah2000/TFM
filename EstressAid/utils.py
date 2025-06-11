from enum import Enum 

class Role(Enum):
    USER = "user"
    BOT = "bot"
class Message:
    def __init__(self, role, content, additional_kwargs=None):
        self.role = role
        self.content = content
        self.additional_kwargs = additional_kwargs if additional_kwargs is not None else {}

    def to_dict(self):
        return {
            "role": self.role,
            "content": self.content,
            "additional_kwargs": self.additional_kwargs
        }

