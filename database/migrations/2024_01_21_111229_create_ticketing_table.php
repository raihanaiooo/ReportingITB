<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ticketing', function (Blueprint $table) {
            $table->id();
            $table->integer('id_scrape');
            $table->string('assign')->nullable();  //, ['administrator', 'Ami Nellasari', 'Ario Sutomo', 'Helpdesk DTI', 'Iwan Setiawan', 'Manager DTI', 'Mohammad Erwin Saputra', 'Ops1', 'Ops2', 'Ops3']);
            $table->date('createdDate')->nullable();
            $table->date('dueDate')->nullable();
            $table->string('status')->nullable(); //, ['open', 'in progress', 'closed', 'resolved']);
            $table->string('site')->nullable();  //, ['ITB', 'ITB Jatinangor', 'softwareone']);
            $table->string('priority')->nullable();  //, ['High', 'Low', 'Normal', 'Urgent']);
            $table->string('group')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticketing');
    }
};
