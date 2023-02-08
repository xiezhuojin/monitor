export interface Position {
    lng: number
    lat: number
}

export interface Device {
    id: string,
    position: Position,
    functional: boolean,
}

export interface Horn extends Device {}
export interface Radar extends Device {}
export interface Camera extends Device {}