import com.itextpdf.forms.PdfPageFormCopier;
import com.itextpdf.kernel.crypto.BadPasswordException;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.font.*;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.io.font.FontConstants;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
 
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.UUID;
import javax.servlet.*;
import javax.servlet.http.*;

public class SplashGen extends HttpServlet
{
    public void doGet(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException
    {
        // Set response content type
        response.setContentType("text/html");

        // Actual logic goes here.
        PrintWriter out = response.getWriter();
        String message = "Hi from splash.";
        out.println("<h1>" + message + "</h1>");
    }

    private static void createSplash(Rectangle pageSize)
        throws IOException
    {
        PdfWriter writer = new PdfWriter(new File("splashTmp.pdf"));
        PdfDocument pdf = new PdfDocument(writer);
        pdf.setDefaultPageSize(new PageSize(pageSize));
        pdf.setTagged();
        pdf.getCatalog().setLang(new PdfString("en-US"));
        pdf.getCatalog().setViewerPreferences(new PdfViewerPreferences().setDisplayDocTitle(true));
        PdfDocumentInfo info = pdf.getDocumentInfo();
        info.setTitle("eScholarship splash page");

        Document document = new Document(pdf);

        document.setMargins(50, 50, 50, 50);

        PdfFont normalFont = PdfFontFactory.createFont(FontConstants.HELVETICA);
        PdfFont boldFont = PdfFontFactory.createFont(FontConstants.HELVETICA_BOLD);

        document.setFont(normalFont);

        Paragraph p = new Paragraph("UC San Diego");
        p.setFont(boldFont).setFontSize(16);
        document.add(p);

        p = new Paragraph("Previously Published Works");
        p.setFont(boldFont).setFontSize(14);
        document.add(p);

        document.add(new Paragraph("Hello World!"));
        document.close();
    }

    public static void main(String[] args)
        throws IOException
    {
        String coverPath = args[0];
        String resourcePath = args[1];
        String destPath = args[2];

        System.err.format("Processing '%s'.\n", resourcePath);

        PdfDocument pdfDoc = null;
        PdfDocument cover = null;
        boolean reEncrypt = false;
        long perms = 0;
        int cryptoMode = 0;
        try {
            PdfReader reader1 = new PdfReader(resourcePath);
            PdfWriter writer = new PdfWriter(destPath);
            try {
                pdfDoc = new PdfDocument(reader1, writer);
            }
            catch (BadPasswordException e) {
                System.err.println("  Encrypted2 file, trying with empty password.");
                reader1.close();
                reader1 = new PdfReader(resourcePath, new ReaderProperties().setPassword("".getBytes()));
                reader1.setUnethicalReading(true); // we're passing files through to user; it's their decision to make.
                //writer.close();
                //writer = new PdfWriter(destPath,
                //    new WriterProperties().setStandardEncryption("".getBytes(), "".getBytes(), (int)reader1.getPermissions(),
                //        EncryptionConstants.ENCRYPTION_AES_128 | EncryptionConstants.DO_NOT_ENCRYPT_METADATA));
                pdfDoc = new PdfDocument(reader1, writer);
                cryptoMode = reader1.getCryptoMode();
                perms = reader1.getPermissions();
                /*
                System.out.println(String.format("mode=0x%x", reader1.getCryptoMode()));
                System.out.println(String.format("perm=0x%x", reader1.getPermissions()));
                System.out.format("STANDARD_ENCRYPTION_40=%d\n", EncryptionConstants.STANDARD_ENCRYPTION_40);
                System.out.format("STANDARD_ENCRYPTION_128=%d\n", EncryptionConstants.STANDARD_ENCRYPTION_128);
                System.out.format("ENCRYPTION_AES_128=%d\n", EncryptionConstants.ENCRYPTION_AES_128);
                System.out.format("ENCRYPTION_AES_256=%d\n", EncryptionConstants.ENCRYPTION_AES_256);
                System.out.format("DO_NOT_ENCRYPT_METADATA=%d\n", EncryptionConstants.DO_NOT_ENCRYPT_METADATA);
                System.out.format("EMBEDDED_FILES_ONLY=%d\n", EncryptionConstants.EMBEDDED_FILES_ONLY);
                System.out.format("ALLOW_PRINTING=%d\n", EncryptionConstants.ALLOW_PRINTING);
                System.out.format("ALLOW_MODIFY_CONTENTS=%d\n", EncryptionConstants.ALLOW_MODIFY_CONTENTS);
                System.out.format("ALLOW_MODIFY_CONTENTS=%d\n", EncryptionConstants.ALLOW_MODIFY_CONTENTS);
                System.out.format("ALLOW_COPY=%d\n", EncryptionConstants.ALLOW_COPY);
                System.out.format("ALLOW_MODIFY_ANNOTATIONS=%d\n", EncryptionConstants.ALLOW_MODIFY_ANNOTATIONS);
                System.out.format("ALLOW_FILL_IN=%d\n", EncryptionConstants.ALLOW_FILL_IN);
                System.out.format("ALLOW_SCREENREADERS=%d\n", EncryptionConstants.ALLOW_SCREENREADERS);
                System.out.format("ALLOW_ASSEMBLY=%d\n", EncryptionConstants.ALLOW_ASSEMBLY);
                System.out.format("ALLOW_DEGRADED_PRINTING=%d\n", EncryptionConstants.ALLOW_DEGRADED_PRINTING);
                */
                reEncrypt = true;
            }

            createSplash(pdfDoc.getPage(1).getPageSize());

            PdfReader reader2 = new PdfReader("splashTmp.pdf");
            cover = new PdfDocument(reader2);
            cover.copyPagesTo(1, 1, pdfDoc, 1, new PdfPageFormCopier());
        }
        finally {
            if (cover != null)
                cover.close();
            if (pdfDoc != null)
                pdfDoc.close();
        }

        if (reEncrypt) {
            System.err.println("  Re-encrypting.");
            PdfReader reader = new PdfReader(destPath);
            PdfWriter writer = new PdfWriter(destPath + "-enc",
                    new WriterProperties().setStandardEncryption(
                        "".getBytes(),  // user password
                        UUID.randomUUID().toString().getBytes(), // owner password
                        (int)perms,
                        cryptoMode));
            pdfDoc = new PdfDocument(reader, writer);
            pdfDoc.close();
            File renFrom = new File(destPath + "-enc");
            File renTo = new File(destPath);
            renTo.delete();
            renFrom.renameTo(renTo);
        }
    }
}
