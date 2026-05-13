export type ShoppingListItem = string;

export type ClientToWebSocketMessage =
  | { action: "addItem"; payload: ShoppingListItem }
  | { action: "removeItem"; payload: ShoppingListItem }
  | { action: "addItems"; payload: ShoppingListItem[] }
  | { action: "clearList" };

export type WebSocketToClientMessage =
  | { type: "updatedList"; data: ShoppingListItem[] }
  | { type: "sessionCount"; data: number }
  | { type: "error"; message: string };


export type InputCommand = string;

export type AICommandSuccess = 
  { 
    success: true,
    itemsAdded: number, 
    items: ShoppingListItem[]
  };

  export type AICommandError =
  { 
    success: false,
    error: string
  };

export type AICommandResponse = AICommandSuccess | AICommandError;

export type ConnectionStatus = "connected" | "connecting" | "disconnected";