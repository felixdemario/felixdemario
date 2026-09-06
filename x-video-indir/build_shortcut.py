#!/usr/bin/env python3
"""X (Twitter) video indirme kestirmesini uretir.

Cikti: X-Video-Indir.shortcut  (imzasiz plist formati)

Akis:
  Paylas sayfasindan gelen baglanti -> api.fxtwitter.com JSON -> videolar ->
  her videoyu indir -> Fotograflar'a kaydet -> bildirim.
"""

import plistlib
import uuid
from pathlib import Path

OUT = Path(__file__).with_name("X-Video-Indir.shortcut")

# Kestirme icindeki her eylemin ciktisina UUID veriyoruz ki sonraki
# eylemler "magic variable" olarak buna referans verebilsin.
def uid():
    return str(uuid.uuid4()).upper()


def out_ref(action_uuid, name):
    """Bir eylemin ciktisina tam-deger referansi (sozluk/liste/dosya icin)."""
    return {
        "Value": {"Type": "ActionOutput", "OutputUUID": action_uuid, "OutputName": name},
        "WFSerializationType": "WFTextTokenAttachment",
    }


def out_text(action_uuid, name):
    """Bir eylemin ciktisina metin alani icindeki referans (URL, metin vb.)."""
    return {
        "Value": {
            "string": "￼",
            "attachmentsByRange": {
                "{0, 1}": {"Type": "ActionOutput", "OutputUUID": action_uuid, "OutputName": name}
            },
        },
        "WFSerializationType": "WFTextTokenString",
    }


def var_ref(name):
    return {
        "Value": {"Type": "Variable", "VariableName": name},
        "WFSerializationType": "WFTextTokenAttachment",
    }


def text(value):
    return {"Value": {"string": value}, "WFSerializationType": "WFTextTokenString"}


def action(identifier, params):
    return {"WFWorkflowActionIdentifier": identifier, "WFWorkflowActionParameters": params}


# --- UUID'ler --------------------------------------------------------------
u_links = uid()      # Girdiden baglantilari al
u_first = uid()      # Listedeki ilk oge
u_strip = uid()      # Sorgu parametrelerini sil
u_api = uid()        # Alan adini api.fxtwitter.com ile degistir
u_fetch = uid()      # JSON'u indir
u_tweet = uid()      # tweet
u_media = uid()      # media
u_videos = uid()     # videos
u_url = uid()        # url
u_dl = uid()         # video dosyasini indir
g_repeat = uid()     # tekrar blogu kimligi

SHORTCUT_INPUT = {
    "Value": {
        "string": "￼",
        "attachmentsByRange": {"{0, 1}": {"Type": "ExtensionInput", "OutputName": "Shortcut Input"}},
    },
    "WFSerializationType": "WFTextTokenString",
}

actions = [
    # 1) Paylasilan icerikten baglantilari cikar
    action("is.workflow.actions.detect.link", {
        "UUID": u_links,
        "WFInput": SHORTCUT_INPUT,
    }),
    # 2) Ilk baglantiyi al
    action("is.workflow.actions.getitemfromlist", {
        "UUID": u_first,
        "WFInput": out_ref(u_links, "URLs"),
        "WFItemSpecifier": "First Item",
    }),
    # 3) ?t=... gibi izleme parametrelerini temizle
    action("is.workflow.actions.text.replace", {
        "UUID": u_strip,
        "WFInput": out_text(u_first, "Item from List"),
        "WFReplaceTextFind": text(r"\?.*$"),
        "WFReplaceTextReplace": text(""),
        "WFReplaceTextRegularExpression": True,
    }),
    # 4) Alan adini fxtwitter API'sine cevir
    action("is.workflow.actions.text.replace", {
        "UUID": u_api,
        "WFInput": out_text(u_strip, "Updated Text"),
        "WFReplaceTextFind": text(r"^https?://(www\.|mobile\.)?(x|twitter|vxtwitter|fixupx|fxtwitter)\.com/"),
        "WFReplaceTextReplace": text("https://api.fxtwitter.com/"),
        "WFReplaceTextRegularExpression": True,
    }),
    # 5) JSON'u indir
    action("is.workflow.actions.downloadurl", {
        "UUID": u_fetch,
        "WFURL": out_text(u_api, "Updated Text"),
        "WFHTTPMethod": "GET",
    }),
    # 6-8) tweet -> media -> videos
    action("is.workflow.actions.getvalueforkey", {
        "UUID": u_tweet,
        "WFInput": out_ref(u_fetch, "Contents of URL"),
        "WFDictionaryKey": text("tweet"),
        "WFGetDictionaryValueType": "Value",
    }),
    action("is.workflow.actions.getvalueforkey", {
        "UUID": u_media,
        "WFInput": out_ref(u_tweet, "Dictionary Value"),
        "WFDictionaryKey": text("media"),
        "WFGetDictionaryValueType": "Value",
    }),
    action("is.workflow.actions.getvalueforkey", {
        "UUID": u_videos,
        "WFInput": out_ref(u_media, "Dictionary Value"),
        "WFDictionaryKey": text("videos"),
        "WFGetDictionaryValueType": "Value",
    }),
    # 9) Her video icin tekrarla (bir gonderide 4 videoya kadar olabilir)
    action("is.workflow.actions.repeat.each", {
        "UUID": uid(),
        "GroupingIdentifier": g_repeat,
        "WFControlFlowMode": 0,
        "WFInput": out_ref(u_videos, "Dictionary Value"),
    }),
    action("is.workflow.actions.getvalueforkey", {
        "UUID": u_url,
        "WFInput": var_ref("Repeat Item"),
        "WFDictionaryKey": text("url"),
        "WFGetDictionaryValueType": "Value",
    }),
    action("is.workflow.actions.downloadurl", {
        "UUID": u_dl,
        "WFURL": out_text(u_url, "Dictionary Value"),
        "WFHTTPMethod": "GET",
    }),
    action("is.workflow.actions.savetocameraroll", {
        "UUID": uid(),
        "WFInput": out_ref(u_dl, "Contents of URL"),
    }),
    action("is.workflow.actions.repeat.each", {
        "UUID": uid(),
        "GroupingIdentifier": g_repeat,
        "WFControlFlowMode": 2,
    }),
    # 10) Bitti bildirimi
    action("is.workflow.actions.notification", {
        "UUID": uid(),
        "WFNotificationActionBody": text("Video Fotograflar'a kaydedildi ✅"),
        "WFNotificationActionSound": False,
    }),
]

shortcut = {
    "WFWorkflowClientVersion": "2605.0.5",
    "WFWorkflowMinimumClientVersion": 900,
    "WFWorkflowMinimumClientVersionString": "900",
    "WFWorkflowIcon": {
        "WFWorkflowIconStartColor": 4274264319,
        "WFWorkflowIconGlyphNumber": 59511,
    },
    "WFWorkflowImportQuestions": [],
    "WFWorkflowTypes": ["ActionExtension"],
    "WFQuickActionSurfaces": [],
    "WFWorkflowInputContentItemClasses": [
        "WFURLContentItem",
        "WFStringContentItem",
        "WFRichTextContentItem",
        "WFSafariWebPageContentItem",
    ],
    "WFWorkflowHasOutputActions": False,
    "WFWorkflowHasShortcutInputVariables": True,
    "WFWorkflowActions": actions,
}

OUT.write_bytes(plistlib.dumps(shortcut, fmt=plistlib.FMT_BINARY))
print(f"Yazildi: {OUT} ({OUT.stat().st_size} bayt, {len(actions)} eylem)")
