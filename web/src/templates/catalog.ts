import { countryTokens, type AppLocale, type CountryId } from "@/lib/countries";
import { SOURCES } from "./generated";

export type TemplateLanguage = "javascript" | "rust";
export type TemplateCategory = "start" | "latam" | "contracts";

type Copy = { name: string; description: string; tip: string; tokens: Record<string, string> };

export type Template = {
  id: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  needsAccount: boolean;
  copy: Record<AppLocale, Copy>;
};

const NEEDS_ES = "Necesitas una cuenta de práctica: créala en el panel Cuenta.";
const NEEDS_PT = "Você precisa de uma conta de prática: crie no painel Conta.";
const VIEW_ES = "Míralo en el explorador:";
const VIEW_PT = "Veja no explorador:";

export const TEMPLATES: Template[] = [
  {
    id: "first-account",
    category: "start",
    language: "javascript",
    needsAccount: false,
    copy: {
      es: {
        name: "Tu primera cuenta",
        description: "Crea un par de claves y recibe XLM de prueba",
        tip: "No necesitas editar nada. Pulsa Ejecutar y mira la consola.",
        tokens: {
          intro: "Una cuenta de Stellar es un par de claves: una pública (G...) y una secreta (S...).",
          safe: "Esto corre en testnet: el dinero es de prueba y no tiene valor.",
          public_label: "Clave pública:",
          secret_warning: "La clave secreta nunca se comparte. Por eso este ejemplo no la imprime.",
          funding: "Pidiendo XLM de prueba a Friendbot...",
          balance_label: "Saldo:",
          view_label: VIEW_ES,
        },
      },
      "pt-BR": {
        name: "Sua primeira conta",
        description: "Crie um par de chaves e receba XLM de teste",
        tip: "Não precisa editar nada. Clique em Executar e olhe o console.",
        tokens: {
          intro: "Uma conta Stellar é um par de chaves: uma pública (G...) e uma secreta (S...).",
          safe: "Isto roda na testnet: o dinheiro é de teste e não tem valor.",
          public_label: "Chave pública:",
          secret_warning: "A chave secreta nunca é compartilhada. Por isso este exemplo não a imprime.",
          funding: "Pedindo XLM de teste ao Friendbot...",
          balance_label: "Saldo:",
          view_label: VIEW_PT,
        },
      },
    },
  },
  {
    id: "send-xlm",
    category: "start",
    language: "javascript",
    needsAccount: true,
    copy: {
      es: {
        name: "Enviar XLM",
        description: "Tu primer pago entre dos cuentas",
        tip: "Cambia AMOUNT y vuelve a ejecutar para ver otro pago.",
        tokens: {
          intro: "Un pago es una transacción con una operación: construir, firmar y enviar.",
          needs_account: NEEDS_ES,
          amount_note: "Monto en XLM, siempre como texto.",
          destination_note: "Creamos una cuenta destino para que el ejemplo funcione sin editar nada.",
          destination_label: "Cuenta destino:",
          submit_note: "constela.submit firma con tu cuenta y envía. Tu clave nunca entra en este código.",
          sent_label: "Pago enviado:",
          view_label: VIEW_ES,
        },
      },
      "pt-BR": {
        name: "Enviar XLM",
        description: "Seu primeiro pagamento entre duas contas",
        tip: "Altere AMOUNT e execute de novo para ver outro pagamento.",
        tokens: {
          intro: "Um pagamento é uma transação com uma operação: construir, assinar e enviar.",
          needs_account: NEEDS_PT,
          amount_note: "Valor em XLM, sempre como texto.",
          destination_note: "Criamos uma conta de destino para o exemplo funcionar sem editar nada.",
          destination_label: "Conta de destino:",
          submit_note: "constela.submit assina com sua conta e envia. Sua chave nunca entra neste código.",
          sent_label: "Pagamento enviado:",
          view_label: VIEW_PT,
        },
      },
    },
  },
  {
    id: "trustline",
    category: "start",
    language: "javascript",
    needsAccount: true,
    copy: {
      es: {
        name: "Crear una trustline",
        description: "Autoriza a tu cuenta a recibir un token",
        tip: "Después de ejecutar, busca tu cuenta en el Explorador para ver el nuevo activo.",
        tokens: {
          intro: "Una trustline indica que tu cuenta acepta un token específico.",
          explain: "Sin ella, nadie puede enviarte ese token. XLM no la necesita.",
          needs_account: NEEDS_ES,
          issuer_note: "Creamos un emisor de prueba. En la práctica sería el emisor real del token.",
          asset_code: "SOLDEMO",
          done_label: "Trustline creada para:",
          view_label: VIEW_ES,
        },
      },
      "pt-BR": {
        name: "Criar uma trustline",
        description: "Autorize sua conta a receber um token",
        tip: "Depois de executar, procure sua conta no Explorador para ver o novo ativo.",
        tokens: {
          intro: "Uma trustline indica que sua conta aceita um token específico.",
          explain: "Sem ela, ninguém pode enviar esse token para você. XLM não precisa dela.",
          needs_account: NEEDS_PT,
          issuer_note: "Criamos um emissor de teste. Na prática seria o emissor real do token.",
          asset_code: "SOLDEMO",
          done_label: "Trustline criada para:",
          view_label: VIEW_PT,
        },
      },
    },
  },
  {
    id: "remittance",
    category: "latam",
    language: "javascript",
    needsAccount: true,
    copy: {
      es: {
        name: "Remesa familiar",
        description: "Envía dinero a {{city}} y mide tiempo y costo",
        tip: "Compara el tiempo y la comisión reales que muestra la consola.",
        tokens: {
          intro: "Caso real: una familia en {{city}} ({{country}}) recibe dinero de un familiar en el exterior.",
          honest_note: "Usamos XLM de prueba. Una remesa real suele usar stablecoins y anchors para convertir a {{currency}}.",
          needs_account: NEEDS_ES,
          amount_note: "Monto en XLM de prueba.",
          memo: "Apoyo familiar",
          memo_note: "Nota visible en la red, máximo 28 bytes. No pongas datos personales.",
          family_note: "Creamos la cuenta de la familia para el ejemplo.",
          family_label: "Cuenta de la familia:",
          sent_label: "Enviado:",
          time_label: "Tiempo de confirmación:",
          fee_label: "Comisión de red:",
          view_label: VIEW_ES,
        },
      },
      "pt-BR": {
        name: "Remessa familiar",
        description: "Envie dinheiro para {{city}} e meça tempo e custo",
        tip: "Compare o tempo e a taxa reais que aparecem no console.",
        tokens: {
          intro: "Caso real: uma família em {{city}} ({{country}}) recebe dinheiro de um parente no exterior.",
          honest_note: "Usamos XLM de teste. Uma remessa real costuma usar stablecoins e anchors para converter em {{currency}}.",
          needs_account: NEEDS_PT,
          amount_note: "Valor em XLM de teste.",
          memo: "Apoio familiar",
          memo_note: "Nota visível na rede, máximo de 28 bytes. Não coloque dados pessoais.",
          family_note: "Criamos a conta da família para o exemplo.",
          family_label: "Conta da família:",
          sent_label: "Enviado:",
          time_label: "Tempo de confirmação:",
          fee_label: "Taxa da rede:",
          view_label: VIEW_PT,
        },
      },
    },
  },
  {
    id: "supplier-payment",
    category: "latam",
    language: "javascript",
    needsAccount: false,
    copy: {
      es: {
        name: "Pago a proveedor en stablecoin",
        description: "Trustlines, emisión y pago completos",
        tip: "Funciona sin cuenta. Tarda unos segundos porque crea tres cuentas de prueba.",
        tokens: {
          intro: "Caso real: un negocio en {{city}} paga a su proveedor con una stablecoin.",
          demo_note: "USDDEMO es un token de prueba que emitimos aquí; no es USDC ni vale dinero.",
          runs_alone: "Con un token real el flujo es igual, pero el emisor sería la empresa que lo respalda.",
          accounts_ready: "Cuentas de emisor, comprador y proveedor listas.",
          step_trust: "Paso 1: comprador y proveedor aceptan el token.",
          trust_done: "Trustlines creadas.",
          step_issue: "Paso 2: el emisor entrega tokens al comprador.",
          step_pay: "Paso 3: el comprador paga al proveedor.",
          memo: "Factura 001",
          paid_label: "Proveedor recibió:",
          view_label: VIEW_ES,
        },
      },
      "pt-BR": {
        name: "Pagamento a fornecedor em stablecoin",
        description: "Trustlines, emissão e pagamento completos",
        tip: "Funciona sem conta. Leva alguns segundos porque cria três contas de teste.",
        tokens: {
          intro: "Caso real: um negócio em {{city}} paga seu fornecedor com uma stablecoin.",
          demo_note: "USDDEMO é um token de teste emitido aqui; não é USDC nem vale dinheiro.",
          runs_alone: "Com um token real o fluxo é igual, mas o emissor seria a empresa que o lastreia.",
          accounts_ready: "Contas de emissor, comprador e fornecedor prontas.",
          step_trust: "Passo 1: comprador e fornecedor aceitam o token.",
          trust_done: "Trustlines criadas.",
          step_issue: "Passo 2: o emissor entrega tokens ao comprador.",
          step_pay: "Passo 3: o comprador paga o fornecedor.",
          memo: "Nota fiscal 001",
          paid_label: "Fornecedor recebeu:",
          view_label: VIEW_PT,
        },
      },
    },
  },
  {
    id: "group-credit",
    category: "latam",
    language: "javascript",
    needsAccount: true,
    copy: {
      es: {
        name: "Crédito grupal",
        description: "Reparte fondos a un grupo en una sola transacción",
        tip: "Agrega un nombre a GROUP para ver una operación más en la misma transacción.",
        tokens: {
          intro: "Caso real: una coordinadora en {{city}} entrega un crédito solidario a su grupo.",
          atomic_note: "Una transacción admite hasta 100 operaciones: o se ejecutan todas o ninguna.",
          needs_account: NEEDS_ES,
          amount_note: "XLM de prueba por persona. Crear una cuenta requiere al menos 1 XLM.",
          members_note: "Generamos cuentas nuevas para cada integrante.",
          memo: "Credito grupal",
          view_label: VIEW_ES,
        },
      },
      "pt-BR": {
        name: "Crédito em grupo",
        description: "Distribua fundos a um grupo em uma só transação",
        tip: "Adicione um nome a GROUP para ver mais uma operação na mesma transação.",
        tokens: {
          intro: "Caso real: uma coordenadora em {{city}} entrega um crédito solidário ao grupo.",
          atomic_note: "Uma transação aceita até 100 operações: ou todas são executadas ou nenhuma.",
          needs_account: NEEDS_PT,
          amount_note: "XLM de teste por pessoa. Criar uma conta exige pelo menos 1 XLM.",
          members_note: "Geramos contas novas para cada integrante.",
          memo: "Credito em grupo",
          view_label: VIEW_PT,
        },
      },
    },
  },
  {
    id: "document-proof",
    category: "latam",
    language: "javascript",
    needsAccount: true,
    copy: {
      es: {
        name: "Prueba de documento",
        description: "Demuestra que un documento existía en una fecha",
        tip: "Nunca uses DNI, CURP ni otros datos personales, aunque estén en hash.",
        tokens: {
          intro: "Registra el hash de un documento para demostrar que existía en este momento.",
          privacy_warning: "NO registres documentos de identidad: un número corto se descubre probando combinaciones, aunque esté en hash.",
          salt_note: "Por eso mezclamos el contenido con un valor aleatorio (salt) antes del hash.",
          needs_account: NEEDS_ES,
          document_sample: "Acta de la asamblea vecinal de {{city}}",
          document_note: "Cámbialo por un texto no sensible.",
          memo_hash_note: "El hash viaja en el memo; la operación es un pago mínimo a tu propia cuenta, porque toda transacción necesita una.",
          hash_label: "Hash registrado:",
          salt_label: "Salt:",
          keep_salt: "Guarda el salt y el documento: los necesitarás para verificar la prueba.",
          view_label: VIEW_ES,
        },
      },
      "pt-BR": {
        name: "Prova de documento",
        description: "Demonstre que um documento existia em uma data",
        tip: "Nunca use CPF, RG nem outros dados pessoais, mesmo em hash.",
        tokens: {
          intro: "Registra o hash de um documento para demonstrar que ele existia neste momento.",
          privacy_warning: "NÃO registre documentos de identidade: um número curto é descoberto testando combinações, mesmo em hash.",
          salt_note: "Por isso misturamos o conteúdo com um valor aleatório (salt) antes do hash.",
          needs_account: NEEDS_PT,
          document_sample: "Ata da assembleia de moradores de {{city}}",
          document_note: "Troque por um texto não sensível.",
          memo_hash_note: "O hash viaja no memo; a operação é um pagamento mínimo para a sua própria conta, porque toda transação precisa de uma.",
          hash_label: "Hash registrado:",
          salt_label: "Salt:",
          keep_salt: "Guarde o salt e o documento: você vai precisar deles para verificar a prova.",
          view_label: VIEW_PT,
        },
      },
    },
  },
  {
    id: "community-vote",
    category: "latam",
    language: "javascript",
    needsAccount: true,
    copy: {
      es: {
        name: "Votación comunitaria",
        description: "Guarda tu voto en los datos de tu cuenta",
        tip: "Cambia MY_CHOICE y ejecuta otra vez: verás que el voto se puede cambiar.",
        tokens: {
          intro: "Cada cuenta guarda su voto en sus propios datos, visibles para cualquiera.",
          limits: "Es didáctico: el voto se puede cambiar y una persona puede crear muchas cuentas. Para una elección real hace falta un contrato y verificar identidad.",
          needs_account: NEEDS_ES,
          option0: "Arreglar el parque",
          option1: "Mejorar la iluminación",
          option2: "Crear una biblioteca",
          choice_note: "0, 1 o 2.",
          voted_label: "Voto registrado:",
          read_note: "Cualquiera puede leer este dato desde la red.",
          stored_label: "Leído de la red:",
          view_label: VIEW_ES,
        },
      },
      "pt-BR": {
        name: "Votação comunitária",
        description: "Guarde seu voto nos dados da sua conta",
        tip: "Altere MY_CHOICE e execute de novo: você verá que o voto pode mudar.",
        tokens: {
          intro: "Cada conta guarda seu voto nos próprios dados, visíveis para todos.",
          limits: "É didático: o voto pode mudar e uma pessoa pode criar muitas contas. Uma eleição real exige um contrato e verificação de identidade.",
          needs_account: NEEDS_PT,
          option0: "Reformar a praça",
          option1: "Melhorar a iluminação",
          option2: "Criar uma biblioteca",
          choice_note: "0, 1 ou 2.",
          voted_label: "Voto registrado:",
          read_note: "Qualquer pessoa pode ler este dado na rede.",
          stored_label: "Lido da rede:",
          view_label: VIEW_PT,
        },
      },
    },
  },
  {
    id: "hello",
    category: "contracts",
    language: "rust",
    needsAccount: true,
    copy: {
      es: {
        name: "Hola, Soroban",
        description: "Tu primer contrato inteligente",
        tip: "Compila, despliega y llama a hello desde la pestaña Contratos.",
        tokens: { intro: "Tu primer contrato: recibe un nombre y devuelve un saludo.", hello_doc: "Devuelve el saludo y el nombre recibido.", greeting: "Hola" },
      },
      "pt-BR": {
        name: "Olá, Soroban",
        description: "Seu primeiro contrato inteligente",
        tip: "Compile, implante e chame hello na aba Contratos.",
        tokens: { intro: "Seu primeiro contrato: recebe um nome e devolve uma saudação.", hello_doc: "Devolve a saudação e o nome recebido.", greeting: "Olá" },
      },
    },
  },
  {
    id: "counter",
    category: "contracts",
    language: "rust",
    needsAccount: true,
    copy: {
      es: {
        name: "Contador",
        description: "Estado persistente y permisos de admin",
        tip: "Al desplegar, usa tu dirección como admin.",
        tokens: {
          intro: "Un contador que guarda su valor en la red. Solo el admin puede reiniciarlo.",
          ttl_note: "Los datos tienen tiempo de vida en ledgers; hay que extenderlo.",
          constructor_doc: "Se ejecuta una sola vez, al desplegar, y guarda quién es el admin.",
          increment_doc: "Suma uno y devuelve el nuevo valor. Cualquiera puede llamarla.",
          get_doc: "Devuelve el valor actual.",
          reset_doc: "Vuelve a cero. Exige la firma del admin guardado.",
        },
      },
      "pt-BR": {
        name: "Contador",
        description: "Estado persistente e permissões de admin",
        tip: "Ao implantar, use seu endereço como admin.",
        tokens: {
          intro: "Um contador que guarda seu valor na rede. Só o admin pode reiniciá-lo.",
          ttl_note: "Os dados têm tempo de vida em ledgers; é preciso estendê-lo.",
          constructor_doc: "Roda uma única vez, na implantação, e guarda quem é o admin.",
          increment_doc: "Soma um e devolve o novo valor. Qualquer pessoa pode chamar.",
          get_doc: "Devolve o valor atual.",
          reset_doc: "Volta a zero. Exige a assinatura do admin guardado.",
        },
      },
    },
  },
  {
    id: "token",
    category: "contracts",
    language: "rust",
    needsAccount: true,
    copy: {
      es: {
        name: "Token didáctico",
        description: "Saldos, transferencias y validaciones",
        tip: "Prueba transferir un monto negativo: el contrato lo rechaza.",
        tokens: {
          intro: "Un token mínimo para aprender cómo funcionan saldos y transferencias.",
          not_sep41: "No implementa todo el estándar SEP-41. Para producción usa una librería auditada.",
          constructor_doc: "Crea el suministro total y se lo asigna al admin.",
          transfer_doc: "Mueve saldo entre cuentas. Exige la firma de quien envía.",
          positive_note: "Sin esta validación, un monto negativo permitiría quitarle saldo a otra cuenta.",
        },
      },
      "pt-BR": {
        name: "Token didático",
        description: "Saldos, transferências e validações",
        tip: "Tente transferir um valor negativo: o contrato rejeita.",
        tokens: {
          intro: "Um token mínimo para aprender como funcionam saldos e transferências.",
          not_sep41: "Não implementa todo o padrão SEP-41. Para produção use uma biblioteca auditada.",
          constructor_doc: "Cria o suprimento total e o atribui ao admin.",
          transfer_doc: "Move saldo entre contas. Exige a assinatura de quem envia.",
          positive_note: "Sem esta validação, um valor negativo permitiria tirar saldo de outra conta.",
        },
      },
    },
  },
  {
    id: "circle",
    category: "contracts",
    language: "rust",
    needsAccount: true,
    copy: {
      es: {
        name: "Ahorro rotativo: {{circle}}",
        description: "Cada ronda, una persona recibe el pozo",
        tip: "Despliégalo con el token XLM de testnet y las direcciones de tu grupo.",
        tokens: {
          intro: "Ahorro rotativo, conocido en {{country}} como {{circle}}.",
          how_it_works: "En cada ronda todos aportan lo mismo y una persona recibe el pozo, siguiendo el orden de la lista.",
          limitation: "Didáctico: si alguien deja de aportar, la ronda queda detenida. No uses dinero real sin auditoría.",
          constructor_doc: "Define el token, el aporte por ronda y el orden de los integrantes.",
          unique_note: "Una persona repetida rompería las cuentas del pozo.",
          contribute_doc: "Transfiere el aporte de la ronda. Exige la firma de quien aporta.",
          payout_doc: "Paga el pozo a quien le toca cuando todos aportaron. Cualquiera puede llamarla.",
          order_note: "Actualizamos el estado antes de transferir para evitar pagos dobles.",
        },
      },
      "pt-BR": {
        name: "Poupança rotativa: {{circle}}",
        description: "A cada rodada, uma pessoa recebe o total",
        tip: "Implante com o token XLM da testnet e os endereços do seu grupo.",
        tokens: {
          intro: "Poupança rotativa. Nome local ({{country}}): {{circle}}.",
          how_it_works: "A cada rodada todos contribuem com o mesmo valor e uma pessoa recebe o total, seguindo a ordem da lista.",
          limitation: "Didático: se alguém parar de contribuir, a rodada fica parada. Não use dinheiro real sem auditoria.",
          constructor_doc: "Define o token, a contribuição por rodada e a ordem dos integrantes.",
          unique_note: "Uma pessoa repetida quebraria as contas do total.",
          contribute_doc: "Transfere a contribuição da rodada. Exige a assinatura de quem contribui.",
          payout_doc: "Paga o total a quem é a vez quando todos contribuíram. Qualquer pessoa pode chamar.",
          order_note: "Atualizamos o estado antes de transferir para evitar pagamentos duplos.",
        },
      },
    },
  },
  {
    id: "vault",
    category: "contracts",
    language: "rust",
    needsAccount: true,
    copy: {
      es: {
        name: "Alcancía con fecha",
        description: "Fondos bloqueados hasta una fecha",
        tip: "unlock_time es un timestamp Unix en segundos.",
        tokens: {
          intro: "Una alcancía: cada persona deposita y solo puede retirar después de una fecha.",
          constructor_doc: "Define el token y la fecha de desbloqueo.",
          deposit_doc: "Guarda fondos en el contrato. Exige la firma de quien deposita.",
          withdraw_doc: "Devuelve todo lo depositado si ya pasó la fecha.",
          order_note: "Borramos el saldo antes de transferir para evitar retiros dobles.",
        },
      },
      "pt-BR": {
        name: "Cofrinho com data",
        description: "Fundos bloqueados até uma data",
        tip: "unlock_time é um timestamp Unix em segundos.",
        tokens: {
          intro: "Um cofrinho: cada pessoa deposita e só pode sacar depois de uma data.",
          constructor_doc: "Define o token e a data de desbloqueio.",
          deposit_doc: "Guarda fundos no contrato. Exige a assinatura de quem deposita.",
          withdraw_doc: "Devolve tudo o que foi depositado se a data já passou.",
          order_note: "Apagamos o saldo antes de transferir para evitar saques duplos.",
        },
      },
    },
  },
  {
    id: "multisig",
    category: "contracts",
    language: "rust",
    needsAccount: true,
    copy: {
      es: {
        name: "Aprobación múltiple",
        description: "Varias firmas antes de aprobar",
        tip: "Solo los firmantes de la lista pueden proponer y aprobar.",
        tokens: {
          intro: "Registra propuestas y exige varias aprobaciones de una lista de firmantes.",
          constructor_doc: "Define los firmantes y cuántas aprobaciones hacen falta.",
          propose_doc: "Crea una propuesta. Quien propone cuenta como primera aprobación.",
          approve_doc: "Suma una aprobación y devuelve si ya se alcanzó el mínimo.",
          duplicate_note: "Sin esta validación, una sola persona podría alcanzar el mínimo.",
          is_approved_doc: "Indica si la propuesta alcanzó el mínimo de aprobaciones.",
        },
      },
      "pt-BR": {
        name: "Aprovação múltipla",
        description: "Várias assinaturas antes de aprovar",
        tip: "Só os assinantes da lista podem propor e aprovar.",
        tokens: {
          intro: "Registra propostas e exige várias aprovações de uma lista de assinantes.",
          constructor_doc: "Define os assinantes e quantas aprovações são necessárias.",
          propose_doc: "Cria uma proposta. Quem propõe conta como primeira aprovação.",
          approve_doc: "Soma uma aprovação e devolve se o mínimo foi alcançado.",
          duplicate_note: "Sem esta validação, uma única pessoa poderia alcançar o mínimo.",
          is_approved_doc: "Indica se a proposta alcançou o mínimo de aprovações.",
        },
      },
    },
  },
];

export function fillTokens(text: string, tokens: Record<string, string>): string {
  // Dos pasadas: un texto de la plantilla puede contener tokens del país, como {{city}}.
  const once = (value: string) => value.replace(/\{\{(\w+)\}\}/g, (match, key) => tokens[key] ?? match);
  return once(once(text));
}

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((template) => template.id === id);
}

export function renderTemplate(template: Template, locale: AppLocale, country: CountryId) {
  const copy = template.copy[locale];
  const tokens = { ...countryTokens(country, locale), ...copy.tokens };
  return {
    code: fillTokens(SOURCES[template.id] ?? "", tokens),
    name: fillTokens(copy.name, tokens),
    description: fillTokens(copy.description, tokens),
    tip: fillTokens(copy.tip, tokens),
  };
}
