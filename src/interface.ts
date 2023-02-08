export interface Position {
    lng: number
    lat: number
}

export enum WorkStatus {
    Functional,
    Malfunction,
}

export interface Device {
    id: string,
    position: Position,
    workStatus: WorkStatus,
}

export interface Horn extends Device {}
export interface Radar extends Device {}
export interface Camera extends Device {}