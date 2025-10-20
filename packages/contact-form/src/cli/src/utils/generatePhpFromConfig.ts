import { FormConfig } from '../../../domain/entities/FormConfig';

export function generatePhpFromConfig(config: FormConfig): string {
  return `
$configJson = ${JSON.stringify(config, null, 2)};

try {
    // Rate limit (simple - 10/min)
    session_start();
    $now = time();
    $key = 'formpipe_' . $_POST['replyTo'];
    if (!isset(\\$_SESSION[$key]) || \\$now - \\$_SESSION[$key]['last'] > 60) {
        \\$_SESSION[$key] = ['count' => 0, 'last' => \\$now];
    }
    if (\\$_SESSION[$key]['count'] >= $configJson['rateLimit']) {
        http_response_code(429);
        exit(json_encode(['error' => 'Demasiados envíos']));
    }
    \\$_SESSION[$key]['count']++;

    // Validaciones del JSON
    if (strlen(\\$_POST['subject']) < ${config.rules.subject.minLength} || 
        strlen(\\$_POST['subject']) > ${config.rules.subject.maxLength}) {
        http_response_code(400);
        exit(json_encode(['error' => 'Asunto inválido']));
    }
    if (strlen(\\$_POST['message']) < ${config.rules.message.minLength} || 
        strlen(\\$_POST['message']) > ${config.rules.message.maxLength}) {
        http_response_code(400);
        exit(json_encode(['error' => 'Mensaje inválido']));
    }

    \\$mail = new PHPMailer(true);
    
    // SMTP Config desde JSON
    \\$mail->isSMTP();
    \\$mail->Host       = "$configJson[smtp][host]";
    \\$mail->SMTPAuth   = true;
    \\$mail->Username   = "$configJson[smtp][user]";
    \\$mail->Password   = "$configJson[smtp][pass]";
    \\$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    \\$mail->Port       = ${config.smtp.port};
    
    // Email config desde JSON
    \\$mail->setFrom($configJson[from], 'Formulario de Contacto');
    \\$mail->addAddress($configJson[to]);
    \\$mail->addReplyTo(\\$_POST['replyTo']);
    
    // Contenido
    \\$mail->isHTML(true);
    \\$mail->Subject = \\$_POST['subject'];
    \\$mail->Body    = \\$_POST['message'];
    
    \\$mail->send();
    
    // Email de confirmación (desde JSON)
    if ($configJson[sendConfirmation]) {
        \\$confirmMail = new PHPMailer(true);
        \\$confirmMail->isSMTP();
        \\$confirmMail->Host = "$configJson[smtp][host]";
        // ... misma config SMTP
        \\$confirmMail->Username = "$configJson[smtp][user]";
        \\$confirmMail->Password = "$configJson[smtp][pass]";
        \\$confirmMail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        \\$confirmMail->Port = ${config.smtp.port};
        
        \\$confirmMail->setFrom($configJson[from]);
        \\$confirmMail->addAddress(\\$_POST['replyTo']);
        \\$confirmMail->Subject = 'Confirmación - ' . \\$_POST['subject'];
        \\$confirmMail->Body = "$configJson[sendConfirmation][htmlTemplate]<p>$configJson[sendConfirmation][message]</p>";
        \\$confirmMail->send();
    }
    
    echo json_encode(['success' => true, 'message' => 'Email enviado']);
    
} catch (Exception \\$e) {
    http_response_code(500);
    echo json_encode(['error' => \\$e->getMessage()]);
}`;
}
