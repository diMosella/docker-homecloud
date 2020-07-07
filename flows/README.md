# Flows

## Enhance photos and videos

- metadata
- beeld

### Tools

1. Exiftool
2. Imagemagick
3. Generators (JS, to control maximum filehandles)
4. ffmpeg (webm / vpx)

## FFmpeg

- See: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs#Choosing_a_video_codec


## Imagemagick

- Auto improve images
- Set ``-define dng:use-camera-wb=true`` to use the RAW-embedded color profile for Sony cameras. You can also set these options: use-auto-wb, use-auto-bright, and output-color
- ``magick /home/wim/temp/DSC09670.ARW -define "dng:use-camera-wb=true dng:use-auto-bright=true" -auto-gamma -auto-level -normalize /home/wim/temp/jpg/DSC09670-im.jpg``


## Text recoginition in scanned pdfs

- OCR, tesseract.js
- ``sudo sed -i '/PDF/s/none/read|write/' /etc/ImageMagick-6/policy.xml``
- ``/usr/share/tesseract-ocr/4.00/tessdata/ < assets``
- https://tesseract-ocr.github.io/tessdoc/Data-Files.html

- curl -G "localhost:8000/trigger/?actor=wim&owner=moosel" --data-urlencode "path=moosel/files/vanMoosel Fotos/_originelen/2020/202005/20200512_org - Sony/DSC09550.ARW"

- "...?actor=%a&owner=%o&file=%i" --data-urlencode "path=%n"

## Exiftool
```
~/$ exiftool -config my.config -xmp-dc:mytest="Bar" demo.png
    1 image files updated
~/$ exiftool -xmp-dc:mytest demo.png
Mytest                          : Bar
~/$ cat my.config
%Image::ExifTool::UserDefined = (
    'Image::ExifTool::XMP::dc' => {
        mytest => { },
    },
    # new XMP namespaces (eg. xxx) must be added to the Main XMP table:
    'Image::ExifTool::XMP::Main' => {
        # namespace definition for examples 8 to 11
        xxx => { # <-- must be the same as the NAMESPACE prefix
            SubDirectory => {
                TagTable => 'Image::ExifTool::UserDefined::xxx',
                # (see the definition of this table below)
            },
        },
        # add more user-defined XMP namespaces here...
    },
);

# This is a basic example of the definition for a new XMP namespace.
# This table is referenced through a SubDirectory tag definition
# in the %Image::ExifTool::UserDefined definition above.
# The namespace prefix for these tags is 'xxx', which corresponds to
# an ExifTool family 1 group name of 'XMP-xxx'.
%Image::ExifTool::UserDefined::xxx = (
    GROUPS => { 0 => 'XMP', 1 => 'XMP-xxx', 2 => 'Image' },
    NAMESPACE => { 'xxx' => 'http://ns.myname.com/xxx/1.0/' },
    WRITABLE => 'string', # (default to string-type tags)
    # Example 8.  XMP-xxx:NewXMPxxxTag1 (an alternate-language tag)
    # - replace "NewXMPxxxTag1" with your own tag name (eg. "MyTag")
    NewXMPxxxTag1 => { Writable => 'lang-alt' },
    # Example 9.  XMP-xxx:NewXMPxxxTag2 (a string tag in the Author category)
    NewXMPxxxTag2 => { Groups => { 2 => 'Author' } },
    # Example 10.  XMP-xxx:NewXMPxxxTag3 (an unordered List-type tag)
    NewXMPxxxTag3 => { List => 'Bag' },
    # Example 11.  XMP-xxx:NewXMPxxxStruct (a structured tag)
    # - example structured XMP tag
    NewXMPxxxStruct => {
        # the "Struct" entry defines the structure fields
        Struct => {
            # optional namespace prefix and URI for structure fields
            # (required only if different than NAMESPACE above)
            # --> multiple entries may exist in this namespace lookup,
            # with the last one alphabetically being the default for
            # the fields, but each field may have a "Namespace"
            # element to specify which prefix to use
            NAMESPACE => { 'test' => 'http://x.y.z/test/' },
            # optional structure name (used for warning messages only)
            STRUCT_NAME => 'MyStruct',
            # optional rdf:type property for the structure
            TYPE => 'http://x.y.z/test/xystruct',
            # structure fields (very similar to tag definitions)
            X => { Writable => 'integer' },
            Y => { Writable => 'integer' },
            # a nested structure...
            Things => {
                List => 'Bag',
                Struct => {
                    NAMESPACE => { thing => 'http://x.y.z/thing/' },
                    What  => { },
                    Where => { },
                },
            },
        },
        List => 'Seq', # structures may also be elements of a list
    },
    # Each field in the structure has a corresponding flattened tag that is
    # generated automatically with an ID made from a concatenation of the
    # original structure tag ID and the field name (after capitalizing the
    # first letter of the field name if necessary).  The Name and/or
    # Description of these flattened tags may be changed if desired, but all
    # other tag properties are taken from the structure field definition.
    # The "Flat" flag must be used when setting the Name or Description of a
    # flattened tag.  For example:
    NewXMPxxxStructX => { Name => 'SomeOtherName', Flat => 1 },
);
```
see https://exiftool.org/config.html
