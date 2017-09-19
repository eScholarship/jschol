/*
 * eScholarship 5.0 splash page generator
 */

import com.itextpdf.forms.PdfPageFormCopier;
import com.itextpdf.kernel.crypto.BadPasswordException;
import com.itextpdf.kernel.color.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfDocumentInfo;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.ReaderProperties;
import com.itextpdf.kernel.pdf.PdfString;
import com.itextpdf.kernel.pdf.WriterProperties;
import com.itextpdf.kernel.pdf.PdfViewerPreferences;
import com.itextpdf.kernel.pdf.action.PdfAction;
import com.itextpdf.kernel.pdf.navigation.PdfExplicitDestination;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.io.font.FontConstants;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Link;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Text;

import org.json.JSONArray;
import org.json.JSONTokener;
import org.json.JSONObject;
 
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.URL;
import java.util.UUID;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

class SplashFormatter
{
  PdfDocument pdf;
  Document doc;
  PdfFont normalFont;
  PdfFont boldFont;
  PdfFont italicFont;
  PdfFont boldItalicFont;

  SplashFormatter(PdfDocument in_pdf)
    throws IOException
  {
    pdf = in_pdf;
    doc = new Document(pdf);
    doc.setMargins(50, 50, 50, 50);
    normalFont = PdfFontFactory.createFont("/usr/share/fonts/dejavu/DejaVuSans.ttf", PdfEncodings.IDENTITY_H, true);
    boldFont = PdfFontFactory.createFont("/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf", PdfEncodings.IDENTITY_H, true);
    italicFont = PdfFontFactory.createFont("/usr/share/fonts/dejavu/DejaVuSans-Oblique.ttf", PdfEncodings.IDENTITY_H, true);
    boldItalicFont = PdfFontFactory.createFont("/usr/share/fonts/dejavu/DejaVuSans-BoldOblique.ttf", PdfEncodings.IDENTITY_H, true);
    doc.setFont(normalFont);
  }

  void finish() {
    doc.close();
  }

  void formatPage(JSONArray arr) {
    for (int i=0; i<arr.length(); i++)
      formatElement((JSONObject) arr.get(i));
  }

  void formatElement(JSONObject obj) {
    if (obj.length() != 1)
      throw new RuntimeException(String.format("Element obj should have 1 key: %s", obj));
    String elName = (String) obj.names().get(0);
    Paragraph para = new Paragraph();
    switch (elName) {
      case "paragraph":
        para.setFontSize(11);
        para.setMarginBottom(0);
        para.setMarginTop(0);
        para.setMultipliedLeading(1.0f);
        para.setFont(normalFont);
        formatContent(obj.get(elName), para);
        break;
      case "h1":
        para.setFontSize(16);
        para.setFont(boldFont);
        para.setMarginBottom(0);
        para.setMultipliedLeading(1.1f);
        para.setFontColor(new DeviceRgb(50, 50, 50));
        formatContent(obj.get(elName), para);
        break;
      case "h2":
        para.setFontSize(14);
        para.setFont(boldFont);
        para.setMarginTop(0);
        para.setMultipliedLeading(1.1f);
        para.setFontColor(new DeviceRgb(128, 128, 128));
        formatContent(obj.get(elName), para);
        break;
      case "h3":
        para.setFontSize(12);
        para.setFont(boldFont);
        para.setMarginBottom(0);
        para.setMarginTop(10);
        para.setFontColor(new DeviceRgb(50, 50, 50));
        formatContent(obj.get(elName), para);
        break;
      default:
        throw new RuntimeException(String.format("Unrecognized element: %s", obj));
    }
    doc.add(para);
  }

  void formatContent(Object input, Paragraph addTo) {
    if (input instanceof JSONArray) {
      JSONArray arr = (JSONArray) input;
      for (int i=0; i<arr.length(); i++)
        formatContent(arr.get(i), addTo);
    }
    else if (input instanceof JSONObject) {
      JSONObject obj = (JSONObject) input;
      if (obj.has("text"))
        formatText(obj.get("text"), addTo);
      else if (obj.has("link"))
        formatLink((JSONObject)obj.get("link"), addTo);
      else
        throw new RuntimeException(String.format("Can't find content: %s", obj));
    }
    else
      throw new RuntimeException(String.format("Unrecognized content type: %s", input));
  }

  void formatText(Object text, Paragraph addTo) {
    if (text instanceof String)
      addTo.add(new Text((String)text));
    else if (text instanceof JSONObject)
    {
      JSONObject obj = (JSONObject) text;
      Text t = new Text((String) obj.get("str"));

      if (obj.has("bold")) {
        if (obj.has("italic"))
          t.setFont(boldItalicFont);
        else
          t.setFont(boldFont);
      }
      else if (obj.has("italic"))
        t.setFont(italicFont);

      if (obj.has("sup"))
        t.setTextRise(3).setFontSize(9);
      else if (obj.has("sub"))
        t.setTextRise(-3).setFontSize(9);
      addTo.add(t);
    }
    else if (text instanceof JSONArray) {
      JSONArray arr = (JSONArray) text;
      for (int i=0; i<arr.length(); i++)
        formatText(arr.get(i), addTo);
    }
    else if (text == null) {
      // ignore for now
    }
    else
      throw new RuntimeException(String.format("Unknown text type: %s", text));
  }

  void formatLink(JSONObject data, Paragraph addTo) {
    PdfAction action = PdfAction.createURI((String) data.get("url"));
    Link link = new Link((String) data.get("text"), action);
    link.setUnderline();
    addTo.add(link);
  }
}

public class SplashGen extends HttpServlet
{
  private static final File TEMP_DIR = new File("/apps/eschol/jschol/splash/tmp");

  private void reEncrypt(File combinedPdfFile, long perms, int cryptoMode)
    throws IOException
  {
    File oldFile = new File(combinedPdfFile.toString() + ".old");
    try {
      combinedPdfFile.renameTo(oldFile);
      PdfReader reader = new PdfReader(oldFile.toString());
      PdfWriter writer = new PdfWriter(combinedPdfFile.toString(),
          new WriterProperties().setStandardEncryption(
            "".getBytes(),                           // empty user password
            UUID.randomUUID().toString().getBytes(), // random owner password
            (int)perms, cryptoMode));
      new PdfDocument(reader, writer).close();
    }
    finally {
      if (oldFile.exists())
        oldFile.delete();
    }
  }

  public void doGet(HttpServletRequest request, HttpServletResponse response)
    throws ServletException, IOException
  {
    response.getWriter().println("splash generator is up");
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response)
    throws ServletException, IOException
  {
    File inputPdfFile = null;
    File splashPdfFile = null;
    File combinedPdfFile = null;
    PdfDocument inputDoc = null;
    PdfDocument splashDoc = null;
    long perms = 0;
    int cryptoMode = 0;

    try
    {
      // The request is JSON data encoded in UTF-8.
      BufferedInputStream inStream = new BufferedInputStream(request.getInputStream());
      ByteArrayOutputStream jsonBuf = new ByteArrayOutputStream(5000);
      int b;
      while ((b = inStream.read()) != -1)
        jsonBuf.write(b);
      JSONObject data = (JSONObject) (new JSONTokener(jsonBuf.toString("UTF-8")).nextValue());
      System.out.println("Parsed JSON: " + data.toString());

      inputPdfFile = new File(data.getString("pdfFile"));
      splashPdfFile = new File(data.getString("splashFile"));
      combinedPdfFile = new File(data.getString("combinedFile"));

      // Now parse out the input PDF file.
      PdfReader inputPdfReader = new PdfReader(inputPdfFile.toString());
      PdfWriter combinedPdfWriter = new PdfWriter(combinedPdfFile.toString());
      try {
        inputDoc = new PdfDocument(inputPdfReader, combinedPdfWriter);
      }
      catch (BadPasswordException e) {
        inputPdfReader.close();
        inputPdfReader = new PdfReader(inputPdfFile.toString(),
                                       new ReaderProperties().setPassword("".getBytes()));
        inputPdfReader.setUnethicalReading(true); // we're passing files through to user; it's their decision to make.
        inputDoc = new PdfDocument(inputPdfReader, combinedPdfWriter);
        cryptoMode = inputPdfReader.getCryptoMode();
        perms = inputPdfReader.getPermissions();
      }

      // Format the splash page as a PDF
      createSplash(inputDoc.getPage(1).getPageSize(), data.getJSONArray("instrucs"), splashPdfFile);

      // Merge the splash page into the input document as page 1.
      PdfReader splashPdfReader = new PdfReader(splashPdfFile.toString());
      splashDoc = new PdfDocument(splashPdfReader);
      splashDoc.copyPagesTo(1, 1, inputDoc, 1, new PdfPageFormCopier());

      // Some PDF files contain an explicit jump to *their* first page. Reset to *our* first page.
      inputDoc.getCatalog().setOpenAction(
        PdfExplicitDestination.createXYZ(1, 0, inputDoc.getPage(1).getPageSize().getHeight(), 0.75f));

      // Finish everything off
      try {
        splashDoc.close();
      }
      finally {
        splashDoc = null;
      }
      try {
        inputDoc.close();
      }
      finally {
        inputDoc = null;
      }

      // If the original doc was encrypted (i.e. "protected"), preserve that.
      if (cryptoMode != 0)
        reEncrypt(combinedPdfFile, perms, cryptoMode);

      // All done.
      response.setContentType("text/plain");
      response.getWriter().println("ok");
    }
    finally {
      if (inputDoc != null)
        inputDoc.close();
      if (splashDoc != null)
        splashDoc.close();
    }
  }

  private void createSplash(Rectangle pageSizeRect, Object instrucs, File splashPdfFile)
    throws IOException
  {
    PdfWriter writer = new PdfWriter(splashPdfFile);
    PdfDocument pdf = new PdfDocument(writer);
    PageSize pageSize = new PageSize(Math.max(500, Math.min(800, pageSizeRect.getWidth())),
                                     Math.max(700, Math.min(900, pageSizeRect.getHeight())));
    pdf.setDefaultPageSize(pageSize);
    pdf.setTagged();
    pdf.getCatalog().setLang(new PdfString("en-US"));
    SplashFormatter formatter = new SplashFormatter(pdf);
    formatter.formatPage((JSONArray)instrucs);
    formatter.finish();
  }
}
