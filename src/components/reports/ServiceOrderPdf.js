import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottom: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 10,
    },
    logoArea: {
        width: '40%',
    },
    companyInfo: {
        width: '60%',
        textAlign: 'right',
        fontSize: 10,
        color: '#666666',
        lineHeight: 1.4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: '#F3F4F6',
        padding: 5,
        marginBottom: 8,
        color: '#111827',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    col: {
        flex: 1,
    },
    label: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 2,
    },
    value: {
        fontSize: 10,
        color: '#111827',
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 10,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tableHeader: {
        backgroundColor: '#F9FAFB',
        padding: 5,
        fontSize: 9,
        fontWeight: 'bold',
    },
    tableCell: {
        margin: 'auto',
        padding: 5,
        fontSize: 9,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#9CA3AF',
        borderTop: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10,
    },
    statusBadge: {
        padding: "4 8",
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        fontSize: 10,
        alignSelf: 'flex-start'
    }
});

const Currency = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const DateFmt = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-';

const ServiceOrderPdf = ({ os }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoArea}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2563EB' }}>NEXUS OS</Text>
                        <Text style={{ fontSize: 10, marginTop: 4 }}>Soluções em Automação</Text>
                    </View>
                    <View style={styles.companyInfo}>
                        <Text>CNPJ: 00.000.000/0001-00</Text>
                        <Text>Rua da Tecnologia, 123 - Vl. Inovação</Text>
                        <Text>São Paulo - SP</Text>
                        <Text>Contato: (11) 99999-9999</Text>
                        <Text>www.nexusos.com.br</Text>
                    </View>
                </View>

                {/* OS Info & Client */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={styles.title}>Ordem de Serviço #{os.code}</Text>
                        <Text style={styles.statusBadge}>{os.status}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 20 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>Dados do Cliente</Text>
                            <Text style={styles.value}>{os.client.name}</Text>
                            <Text style={styles.label}>{os.client.emailPrimary || '-'}</Text>
                            <Text style={styles.label}>{os.client.phonePrimary || '-'}</Text>
                            <Text style={styles.label}>{os.client.city} - {os.client.state}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>Equipamento</Text>
                            {os.equipment ? (
                                <>
                                    <Text style={styles.value}>{os.equipment.name} {os.equipment.brand} {os.equipment.model}</Text>
                                    <Text style={styles.label}>N/S: {os.equipment.serialNumber || '-'}</Text>
                                    {os.serviceLocation === 'INTERNAL' && os.accessories && (
                                        <View style={{ marginTop: 4 }}>
                                            <Text style={styles.label}>Acessórios Inclusos:</Text>
                                            <Text style={[styles.value, { fontSize: 8 }]}>{os.accessories}</Text>
                                        </View>
                                    )}
                                </>
                            ) : <Text style={styles.label}>Não vinculado a equipamento específico</Text>}
                        </View>
                    </View>

                    {/* Logistics Section */}
                    <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={styles.label}>Tipo de Atendimento:</Text>
                                <Text style={[styles.value, { fontWeight: 'bold' }]}>
                                    {os.serviceLocation === 'EXTERNAL' ? 'ASSISTÊNCIA TÉCNICA (CAMPO)' : 'LABORATÓRIO (INTERNO)'}
                                </Text>
                            </View>
                            {os.serviceLocation === 'EXTERNAL' && os.serviceAddress && (
                                <View style={{ flex: 1, marginLeft: 20 }}>
                                    <Text style={styles.label}>Local de Execução:</Text>
                                    <Text style={[styles.value, { fontSize: 8 }]}>{os.serviceAddress}</Text>
                                </View>
                            )}
                            {os.serviceLocation === 'INTERNAL' && os.entryInvoiceNumber && (
                                <View style={{ marginLeft: 20 }}>
                                    <Text style={styles.label}>NF de Entrada:</Text>
                                    <Text style={styles.value}>{os.entryInvoiceNumber}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Technical Report */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Laudo Técnico</Text>

                    <View style={{ marginBottom: 8 }}>
                        <Text style={styles.label}>Defeito Relatado:</Text>
                        <Text style={styles.value}>{os.reportedDefect}</Text>
                    </View>

                    {os.diagnosis && (
                        <View style={{ marginBottom: 8 }}>
                            <Text style={styles.label}>Diagnóstico Técnico:</Text>
                            <Text style={styles.value}>{os.diagnosis}</Text>
                        </View>
                    )}

                    {os.solution && (
                        <View style={{ marginBottom: 8 }}>
                            <Text style={styles.label}>Solução Efetuada:</Text>
                            <Text style={styles.value}>{os.solution}</Text>
                        </View>
                    )}
                </View>

                {/* Items */}
                {(os.services.length > 0 || os.parts.length > 0) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Serviços e Materiais</Text>

                        {/* Table Header */}
                        <View style={[styles.tableRow, { backgroundColor: '#F3F4F6', borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
                            <View style={{ width: '50%', padding: 4 }}><Text style={styles.tableHeader}>Descrição</Text></View>
                            <View style={{ width: '15%', padding: 4 }}><Text style={styles.tableHeader}>Qtd.</Text></View>
                            <View style={{ width: '20%', padding: 4, textAlign: 'right' }}><Text style={styles.tableHeader}>Valor Unit.</Text></View>
                            <View style={{ width: '15%', padding: 4, textAlign: 'right' }}><Text style={styles.tableHeader}>Total</Text></View>
                        </View>

                        {/* Services Rows */}
                        {os.services.map((item, i) => (
                            <View key={`srv-${i}`} style={styles.tableRow}>
                                <View style={{ width: '50%', padding: 4 }}><Text style={styles.tableCell}>{item.service.name}</Text></View>
                                <View style={{ width: '15%', padding: 4 }}><Text style={styles.tableCell}>{item.quantity}</Text></View>
                                <View style={{ width: '20%', padding: 4, textAlign: 'right' }}><Text style={styles.tableCell}>{Currency(item.unitPrice)}</Text></View>
                                <View style={{ width: '15%', padding: 4, textAlign: 'right' }}><Text style={styles.tableCell}>{Currency(item.subtotal)}</Text></View>
                            </View>
                        ))}

                        {/* Parts Rows */}
                        {os.parts.map((item, i) => (
                            <View key={`prt-${i}`} style={styles.tableRow}>
                                <View style={{ width: '50%', padding: 4 }}><Text style={styles.tableCell}>{item.part.name}</Text></View>
                                <View style={{ width: '15%', padding: 4 }}><Text style={styles.tableCell}>{item.quantity}</Text></View>
                                <View style={{ width: '20%', padding: 4, textAlign: 'right' }}><Text style={styles.tableCell}>{Currency(item.unitPrice)}</Text></View>
                                <View style={{ width: '15%', padding: 4, textAlign: 'right' }}><Text style={styles.tableCell}>{Currency(item.subtotal)}</Text></View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Totals */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                    <View style={{ width: '40%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={styles.label}>Total Serviços:</Text>
                            <Text style={styles.value}>R$ {Currency(os.totalServices)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={styles.label}>Total Peças:</Text>
                            <Text style={styles.value}>R$ {Currency(os.totalParts)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5, marginTop: 5 }}>
                            <Text style={[styles.value, { fontWeight: 'bold', fontSize: 12 }]}>TOTAL GERAL:</Text>
                            <Text style={[styles.value, { fontWeight: 'bold', fontSize: 12 }]}>R$ {Currency(os.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Declaro que os serviços acima foram executados e estou de acordo.</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 10 }}>
                        <View style={{ borderTopWidth: 1, width: '40%' }}><Text style={{ marginTop: 5 }}>Técnico Responsável</Text></View>
                        <View style={{ borderTopWidth: 1, width: '40%' }}><Text style={{ marginTop: 5 }}>Cliente</Text></View>
                    </View>
                    <Text>Gerado em {new Date().toLocaleString('pt-BR')} • Nexus OS System</Text>
                </View>

            </Page>
        </Document>
    );
};

export default ServiceOrderPdf;
