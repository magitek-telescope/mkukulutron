import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  screen,
  systemPreferences,
  globalShortcut
} from 'electron'
import { createMenuTemplate } from './ui/menuTemplate'
import * as offsetCalclator from './tools/offsetCalclator'
import * as PlatformResolver from './tools/platformResolver'
import { getTrayPosition, TrayPosition } from './tools/getTrayPosition'
import { getNativeIconName } from './tools/getNativeIconName'
import { createContextTemplate } from './ui/contextTemplate'
import path from 'path'
import { IPCEventNames } from './types/ipc'
import { session } from 'electron';

import './tools/auto-update'

app.on('ready', () => {
  let mainWindow: BrowserWindow

  mainWindow = new BrowserWindow({
    width: 375,
    height: 667,
    transparent: true,
    frame: false,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, './client/index.js')
    }
  })

  mainWindow.loadURL('https://m.kuku.lu')

  // if (process.env.NODE_ENV !== 'production') {
  //   mainWindow.webContents.openDevTools()
  // }

  const tray = new Tray(
    path.join(__dirname, '../assets', getNativeIconName(systemPreferences))
  )
  const offset = offsetCalclator.getOffset()

  mainWindow.on('blur', () => {
    mainWindow.hide()
  })

  Menu.setApplicationMenu(Menu.buildFromTemplate(createMenuTemplate(app)))

  tray.setToolTip('mkukulutron')

  if (PlatformResolver.isWindows()) {
    mainWindow.setPosition(0, 0)
    const trayBounds = tray.getBounds()
    const displayBounds = screen.getPrimaryDisplay().bounds

    // FIXME: 本当にprimaryDisplay?
    const trayPosition = getTrayPosition({ trayBounds, displayBounds })

    switch (trayPosition) {
      case TrayPosition.Left: {
        mainWindow.setPosition(
          trayBounds.x + trayBounds.height,
          displayBounds.height - mainWindow.getBounds().height
        )
        break
      }

      case TrayPosition.Right: {
        mainWindow.setPosition(
          trayBounds.x - mainWindow.getBounds().width - offset.x,
          displayBounds.height - mainWindow.getBounds().height
        )
        break
      }

      case TrayPosition.Top: {
        mainWindow.setPosition(
          displayBounds.width - mainWindow.getBounds().width,
          trayBounds.height
        )
        break
      }

      case TrayPosition.Bottom: {
        mainWindow.setPosition(
          displayBounds.width - mainWindow.getBounds().width,
          displayBounds.height -
            trayBounds.height -
            mainWindow.getBounds().height
        )
        break
      }
    }
  }

  // session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
  //   details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1';
  //   callback({ cancel: false, requestHeaders: details.requestHeaders });
  // });

  tray.on('click', () => {
    if (PlatformResolver.isMacOS()) {
      mainWindow.setPosition(
        tray.getBounds().x - 375 + offset.x,
        tray.getBounds().y + tray.getBounds().height + offset.y
      )
    }
    mainWindow.show()
  })

  tray.on('right-click', () => {
    tray.popUpContextMenu(Menu.buildFromTemplate(createContextTemplate(app)))
  })

  globalShortcut.register('MediaPlayPause', () => {
    mainWindow.webContents.send(IPCEventNames.PLAY_PAUSE)
  })

  globalShortcut.register('MediaPreviousTrack', () => {
    mainWindow.webContents.send(IPCEventNames.PREV)
  })

  globalShortcut.register('MediaNextTrack', () => {
    mainWindow.webContents.send(IPCEventNames.NEXT)
  })
})
