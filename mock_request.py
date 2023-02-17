import json
import asyncio
import random
import time

import websockets


async def hello(websocket):
    set_center = f"""
        let parameter = new AMap.LngLat(113.306646, 23.383048);
        app.$refs.map.setCenter(parameter);
    """
    await websocket.send(set_center)
    await asyncio.sleep(1)

    set_zooms = f"""
        let parameter = [8, 16];
        app.$refs.map.setZooms(parameter);
    """
    await websocket.send(set_zooms)
    await asyncio.sleep(0.5)

    set_zoom = f"""
        let parameter = 14;
        app.$refs.map.setZoom(parameter);
    """
    await websocket.send(set_zoom)
    await asyncio.sleep(0.5)

    set_pitch = f"""
        let parameter = 70;
        app.$refs.map.setPitch(parameter);
    """
    await websocket.send(set_pitch)
    await asyncio.sleep(1)

    set_limit_bounds = f"""
        let parameter =  new AMap.Bounds(new AMap.LngLat(113.271213, 23.362449), new AMap.LngLat(113.341422, 23.416018));
        app.$refs.map.setLimitBounds(parameter);
    """
    await websocket.send(set_limit_bounds)
    await asyncio.sleep(0.5)

    add_horn = f"""
        let parameter = {{id: 1, name: 'horn1', type: 'horn', position: new AMap.LngLat(113.306646, 23.383048), functional: true}};
        app.$refs.map.addDevice(parameter);
    """
    await websocket.send(add_horn)
    await asyncio.sleep(0.5)

    update_horn = f"""
        let parameter = {{id: 1, name: 'horn2', type: 'horn', position: new AMap.LngLat(113.307646, 23.383048), functional: false}};
        app.$refs.map.updateDevice(parameter);
    """
    await websocket.send(update_horn)
    await asyncio.sleep(0.5)

    # hide_horns = f"""
    #     let type = 'horn';
    #     let visibility = false
    #     app.$refs.map.setDeviceVisibilityByType(type, visibility);
    # """
    # await websocket.send(hide_horns)
    # await asyncio.sleep(0.5)

    set_track_clear_interval = f"""
        let parameter = 5000;
        app.$refs.map.setTrackClearInterval(parameter);
    """
    await websocket.send(set_track_clear_interval)
    await asyncio.sleep(1)

    add_zone = f"""
        let parameter = {{
            id: '1',
            type: 'danger',
            path: [
                [
                    new AMap.LngLat(113.307706,23.3737), 
                    new AMap.LngLat(113.315884,23.371746),
                    new AMap.LngLat(113.314939,23.36729),
                    new AMap.LngLat(113.307043,23.368054),
                ],
            ],
            height: 1000,
            color: '#0088ffcc',
        }};
        app.$refs.map.addZone(parameter);
    """
    await websocket.send(add_zone)
    await asyncio.sleep(2)

    update_zone = f"""
        let parameter = {{
            id: '1',
            type: 'danger',
            path: [
                [
                    new AMap.LngLat(113.322407,23.405254), 
                    new AMap.LngLat(113.325025,23.40464),
                    new AMap.LngLat(113.323652,23.400166),
                    new AMap.LngLat(113.316714,23.401668),
                ],
            ],
            height: 1000,
            color: '#0088aacc',
        }};
        app.$refs.map.updateZone(parameter);
    """
    await websocket.send(update_zone)
    await asyncio.sleep(2)

    while True:
        tracks = "[" + ", ".join([get_track() for i in range(10)]) + "]"
        update_tracks = f"""
            let parameter = {tracks};
            app.$refs.map.updateTracks(parameter);
        """
        await websocket.send(update_tracks)
        await asyncio.sleep(1)

def get_track():
    west = 113.271213
    south = 23.362449
    east = 113.341422
    north = 23.416018

    lng = random.randrange(int(west * 1_000_000), int(east * 1_000_000)) / 1_000_000
    lat = random.randrange(int(south * 1_000_000), int(north * 1_000_000)) / 1_000_000
    height = random.randint(50, 5000)
    track_at = int(time.time())
    id = random.randint(1, 10)
    size = random.choice(["'小型'", "'中型'", "'大型'"])
    danger = random.choice(["'低威'", "'中威'", "'高威'"])
    return "{id: " + str(id) + ", position: new AMap.LngLat" + f"({lng}, {lat}), " + f"altitude: {height}, trackAt: {track_at}, " + f"extra_info: {{size: {size}, danger: {danger}}}" + "}"

start_server = websockets.serve(hello, '0.0.0.0', 9000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
