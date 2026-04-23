import re
import sys

try:
    with open('CSEI-s paper/CSEI-s in E revised 20240722.hwp', 'rb') as f:
        data = f.read()
    
    import zlib
    # HWP uses OLE structure. The actual text is zlib compressed in BodyText streams.
    # Python olefile might be installed. Let's try olefile
    import olefile
    if olefile.isOleFile('CSEI-s paper/CSEI-s in E revised 20240722.hwp'):
        ole = olefile.OleFileIO('CSEI-s paper/CSEI-s in E revised 20240722.hwp')
        extracted_text = []
        for d in ole.listdir():
            if d[0] == 'BodyText':
                stream = ole.openstream(d)
                stream_data = stream.read()
                try:
                    # zlib decompress
                    decompressed = zlib.decompress(stream_data, -15)
                    # For simple extraction, just find english strings in utf-16le
                    text = decompressed.decode('utf-16le', errors='ignore')
                    # Just print all ASCII text to see what we have
                    eng_text = re.sub(r'[^\x00-\x7F]+', ' ', text)
                    extracted_text.append(eng_text)
                except Exception as e:
                    pass
        print("\n".join(extracted_text))
    else:
        print("Not an OLE file")
except Exception as e:
    print("Error:", e)
    # Fallback to binary search
    data = open('CSEI-s paper/CSEI-s in E revised 20240722.hwp', 'rb').read()
    strings = re.findall(b'[a-zA-Z0-9 \.,?!()]+', data)
    for s in strings:
        if len(s) > 15:
            print(s.decode('ascii', errors='ignore'))
