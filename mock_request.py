import json
import asyncio
import random
import time

import websockets


async def hello(websocket):
    set_center = json.dumps(
        ["map", "setCenter", "parameters = new AMap.LngLat(113.306646, 23.383048)"])
    await websocket.send(set_center)
    await asyncio.sleep(1)

    set_zooms = json.dumps(["map", "setZooms", "parameters = [8, 16]"])
    await websocket.send(set_zooms)
    await asyncio.sleep(0.5)

    set_zoom = json.dumps(["map", "setZoom", "parameters = 14"])
    await websocket.send(set_zoom)
    await asyncio.sleep(0.5)

    set_pitch = json.dumps(["map", "setPitch", "parameters = 70"])
    await websocket.send(set_pitch)
    await asyncio.sleep(1)

    set_limit_bounds = json.dumps(
        ["map", "setLimitBounds", "parameters =  new AMap.Bounds(new AMap.LngLat(113.271213, 23.362449), new AMap.LngLat(113.341422, 23.416018))"])
    await websocket.send(set_limit_bounds)
    await asyncio.sleep(0.5)

    add_horn_marker = json.dumps(
        ["map", "addHornMarker", "parameters = {id: 1, position: new AMap.LngLat(113.306646, 23.383048), functional: true};"]
    )
    await websocket.send(add_horn_marker)
    await asyncio.sleep(0.5)

    update_horn_marker = json.dumps(
        ["map", "updateHornMarker", "parameters = {id: 1, position: new AMap.LngLat(113.307646, 23.383048), functional: false};"]
    )
    await websocket.send(update_horn_marker)
    await asyncio.sleep(0.5)

    hide_horn_markers = json.dumps(
        ["map", "hideHornMarkers", ""]
    )
    await websocket.send(hide_horn_markers)
    await asyncio.sleep(0.5)

    set_track_clear_interval = json.dumps(
        ["map", "setTrackClearInterval", "parameters = 5000"]
    )
    await websocket.send(set_track_clear_interval)
    await asyncio.sleep(1)

    while True:
        tracks = ", ".join([get_track() for i in range(10000)])
        updateTracks = json.dumps(
            ["map", "updateTracks", f"parameters = [{tracks}]"]
        )
        await websocket.send(updateTracks)
        await asyncio.sleep(1)

def get_track():
    west = 113.271213
    south = 23.362449
    east = 113.341422
    north = 23.416018

    lng = random.randrange(int(west * 1_000_000), int(east * 1_000_000)) / 1_000_000
    lat = random.randrange(int(south * 1_000_000), int(north * 1_000_000)) / 1_000_000
    height = random.randint(100, 300)
    track_at = int(time.time())
    id = random.randint(1, 1000)
    return "{id: " + str(id) + ", position: new AMap.LngLat" + f"({lng}, {lat}), " + f"altitude: {height}, trackAt: {track_at}" + "}"

start_server = websockets.serve(hello, '0.0.0.0', 9000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
